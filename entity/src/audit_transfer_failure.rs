//! `SeaORM` Entity, @generated by sea-orm-codegen 1.1.13

use ethportal_api::{types::query_trace::QueryTrace, Enr};
use sea_orm::{entity::prelude::*, NotSet, Set};
use tracing::{error, info};

use crate::{node_enr, TransferFailureType};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq)]
#[sea_orm(table_name = "audit_transfer_failure")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub audit_id: i32,
    pub sender_node_enr_id: i32,
    pub failure_type: TransferFailureType,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::audit::Entity",
        from = "Column::AuditId",
        to = "super::audit::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    Audit,
    #[sea_orm(
        belongs_to = "super::node_enr::Entity",
        from = "Column::SenderNodeEnrId",
        to = "super::node_enr::Column::Id",
        on_update = "Cascade",
        on_delete = "Cascade"
    )]
    NodeEnr,
}

impl Related<super::audit::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Audit.def()
    }
}

impl Related<super::node_enr::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::NodeEnr.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

// *** Custom additions ***

pub async fn create(
    audit_id: i32,
    sender_enr: &Enr,
    fail_type: TransferFailureType,
    conn: &DatabaseConnection,
) -> Result<Model, DbErr> {
    let node_enr_model = node_enr::get_or_create(sender_enr, conn).await?;

    let transfer_failure = ActiveModel {
        id: NotSet,
        audit_id: Set(audit_id),
        sender_node_enr_id: Set(node_enr_model.id),
        failure_type: Set(fail_type),
    };

    transfer_failure.insert(conn).await
}

pub async fn store_all_failures(audit_id: i32, trace: &QueryTrace, conn: &DatabaseConnection) {
    let mut failures = vec![];

    for (sender_node_id, query_failure) in &trace.failures {
        let Some(sender_info) = trace.metadata.get(sender_node_id) else {
            error!(
                audit.id = audit_id,
                sender.node_id = %sender_node_id,
                "Sender ENR not found in trace metadata",
            );
            continue;
        };
        let Ok(node_enr_model) = node_enr::get_or_create(&sender_info.enr, conn).await else {
            error!(
                audit.id = audit_id,
                sender.enr = %sender_info.enr,
                "Failed to save senders ENR",
            );
            continue;
        };

        let failure_type = TransferFailureType::from(&query_failure.failure);

        info!(
            audit.id = audit_id,
            failure.type = ?failure_type,
            sender.node_id = %sender_node_id,
            "Found new transfer failure",
        );

        failures.push(ActiveModel {
            id: NotSet,
            audit_id: Set(audit_id),
            sender_node_enr_id: Set(node_enr_model.id),
            failure_type: Set(failure_type),
        });
    }

    if failures.is_empty() {
        return;
    }

    if let Err(err) = Entity::insert_many(failures).exec(conn).await {
        error!(
            audit.id = audit_id,
            %err,
            "Failed to save transfer failures",
        );
    }
}
