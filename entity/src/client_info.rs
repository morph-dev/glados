//! `SeaORM` Entity. Generated by sea-orm-codegen 0.10.7
use anyhow::Result;

use sea_orm::{entity::prelude::*, ActiveValue::NotSet, Set};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq)]
#[sea_orm(table_name = "client_info")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub version_info: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::content_audit::Entity")]
    ContentAudit,
    #[sea_orm(has_many = "super::node::Entity")]
    Nodes,
}

impl Related<super::content_audit::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::ContentAudit.def()
    }
}

impl Related<super::node::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Nodes.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}

pub async fn get_or_create(version_info: String, conn: &DatabaseConnection) -> Result<Model> {
    // First try to lookup an existing entry.
    if let Some(client_info) = Entity::find()
        .filter(Column::VersionInfo.eq(version_info.to_owned()))
        .one(conn)
        .await?
    {
        // If there is an existing record, return it
        return Ok(client_info);
    }

    // If no record exists, create one and return it
    let client_info = ActiveModel {
        id: NotSet,
        version_info: Set(version_info.to_owned()),
    };
    Ok(client_info.insert(conn).await?)
}