use anyhow::Result;
use clap::Parser;
use glados_audit::retention::{delete_old_audits, periodically_delete_old_audits};
use glados_audit::stats::periodically_record_stats;
use tracing::{debug, info};

use glados_audit::cli::Args;
use glados_audit::{config::AuditConfig, run_glados_audit};
use migration::{Migrator, MigratorTrait};

#[tokio::main]
async fn main() -> Result<()> {
    // Setup logging
    env_logger::init();

    debug!("Parsing CLI arguments");
    let args = Args::parse();

    info!("Starting glados-audit");
    run_audit(args).await
}

async fn run_audit(args: Args) -> Result<()> {
    let config = AuditConfig::from_args(args).await?;

    Migrator::up(&config.database_connection, None).await?;

    if let Some(retention_period) = config.retention_period {
        info!(
            "Deleting audits older than {} days",
            retention_period.num_days()
        );
        delete_old_audits(retention_period, &config.database_connection).await;
    }

    tokio::spawn(periodically_record_stats(config.clone()));

    tokio::spawn(periodically_delete_old_audits(config.clone()));

    run_glados_audit(config).await;

    debug!("setting up CTRL+C listener");
    tokio::signal::ctrl_c()
        .await
        .expect("failed to pause until ctrl-c");

    info!("got CTRL+C. shutting down...");
    std::process::exit(0);
}
