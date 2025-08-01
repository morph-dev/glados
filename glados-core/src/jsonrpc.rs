use std::{path::PathBuf, time::Duration};

use alloy_primitives::hex::FromHexError;
use entity::{client, content, node, Subprotocol};
use ethportal_api::{
    types::query_trace::QueryTrace, utils::bytes::ByteUtilsError, ContentKeyError, Discv5ApiClient,
    HistoryContentKey, HistoryNetworkApiClient, NodeInfo, OverlayContentKey, RawContentValue,
    RoutingTableInfo, Web3ApiClient,
};
use jsonrpsee::http_client::{HttpClient, HttpClientBuilder};
use sea_orm::DatabaseConnection;
use thiserror::Error;
use url::Url;

/// Configuration details for connection to a Portal network node.
#[derive(Clone, Debug)]
pub enum TransportConfig {
    HTTP(Url),
    IPC(PathBuf),
}

#[derive(Clone, Debug)]
pub struct PortalApi {
    pub client: HttpClient,
}

#[derive(Clone, Debug)]
pub struct PortalClient {
    pub api: PortalApi,
    pub client: client::Model,
    pub node: node::Model,
}

const CONTENT_NOT_FOUND_ERROR_CODE: i32 = -39001;
#[allow(clippy::large_enum_variant)]
#[derive(Error, Debug)]
pub enum JsonRpcError {
    #[error("received formatted response with no error, but contains a None result")]
    ContainsNone,

    #[error("received empty response (EOF only)")]
    Empty,

    #[error("HTTP client error: {0}")]
    HttpClient(String),

    /// Portal network defines "0x" as the response for absent content.
    #[error("expected special 0x 'content absent' message for content request, received HTTP response with None result")]
    SpecialMessageExpected,

    /// Portal network defines "0x" as the response for absent content.
    #[error("received special 0x 'content absent' message for non-content request, expected HTTP response with None result")]
    SpecialMessageUnexpected,

    #[error("unable to convert `{enr_string}` into ENR due to {error}")]
    InvalidEnr {
        error: String, // This source doesn't implement Error
        enr_string: String,
    },

    #[error("unable to convert {input} to hash")]
    InvalidHash { source: FromHexError, input: String },

    #[error("invalid integer conversion")]
    InvalidIntegerConversion(#[from] std::num::TryFromIntError),

    #[error("unable to convert string `{input}`")]
    InvalidJson {
        source: serde_json::Error,
        input: String,
    },

    #[error("non-specific I/O error")]
    IO(#[from] std::io::Error),

    #[error("received malformed response: {0}")]
    Malformed(serde_json::Error),

    #[error("malformed portal client URL")]
    ClientURL { url: String },

    #[error("unable to use byte utils {0}")]
    ByteUtils(#[from] ByteUtilsError),

    #[error("unable to serialize/deserialize")]
    Serialization(#[from] serde_json::Error),

    #[error("could not open file {path:?}")]
    OpenFileFailed {
        source: std::io::Error,
        path: PathBuf,
    },

    #[error("Couldn't convert bytes to ContentKey")]
    ContentKeyError(#[from] ContentKeyError),

    #[error("Query completed without finding content")]
    ContentNotFound { trace: Option<QueryTrace> },

    #[error("Query trace was missing")]
    MissingQueryTrace,

    #[error("Invalid Query trace format")]
    // The string is the raw input that was expected to be a QueryTrace
    InvalidQueryTrace(String),
}

impl From<jsonrpsee::core::client::Error> for JsonRpcError {
    fn from(e: jsonrpsee::core::client::Error) -> Self {
        if let jsonrpsee::core::client::Error::Call(ref error) = e {
            if error.code() == CONTENT_NOT_FOUND_ERROR_CODE {
                return error
                    .data()
                    .map(|data| {
                        let trace_str = data.to_string();
                        serde_json::from_str(&trace_str)
                            .map_or(JsonRpcError::InvalidQueryTrace(trace_str), |trace| {
                                JsonRpcError::ContentNotFound { trace: Some(trace) }
                            })
                    })
                    .unwrap_or(JsonRpcError::ContentNotFound { trace: None });
            }
        }

        // Fallback to the generic HttpClient error variant if no match
        JsonRpcError::HttpClient(e.to_string())
    }
}

impl PortalClient {
    pub async fn new(portal_client_url: String, conn: &DatabaseConnection) -> anyhow::Result<Self> {
        let api = PortalApi::new(portal_client_url).await?;

        let client_version_info = api.get_client_version().await?;
        let node_info = api.get_node_info().await?;

        let client = client::get_or_create(client_version_info, conn).await?;
        let node = node::get_or_create(node_info.enr.node_id(), conn).await?;

        Ok(PortalClient { api, client, node })
    }

    pub fn supports_trace(&self) -> bool {
        self.client.version_info.contains("trin") || self.client.version_info.contains("nimbus")
    }

    pub async fn get_content(
        &self,
        content: &content::Model,
    ) -> Result<(RawContentValue, Option<QueryTrace>), JsonRpcError> {
        if self.supports_trace() {
            self.api
                .get_content_with_trace(content)
                .await
                .map(|(content, trace)| (content, Some(trace)))
        } else {
            self.api
                .get_content(content)
                .await
                .map(|content| (content, None))
        }
    }
}

impl PortalApi {
    pub async fn new(client_url: String) -> Result<Self, JsonRpcError> {
        let http_prefix = "http://";
        let https_prefix = "https://";
        let client = if client_url.strip_prefix(http_prefix).is_some()
            || client_url.strip_prefix(https_prefix).is_some()
        {
            HttpClientBuilder::default()
                .request_timeout(Duration::from_secs(120))
                .build(client_url)?
        } else {
            panic!("Not supported RPC interface {client_url}, use http(s).");
        };

        Ok(PortalApi { client })
    }

    pub async fn get_client_version(&self) -> Result<String, JsonRpcError> {
        Ok(Web3ApiClient::client_version(&self.client).await?)
    }

    pub async fn get_node_info(&self) -> Result<NodeInfo, JsonRpcError> {
        Ok(Discv5ApiClient::node_info(&self.client).await?)
    }

    pub async fn get_routing_table_info(self) -> Result<RoutingTableInfo, JsonRpcError> {
        Ok(Discv5ApiClient::routing_table_info(&self.client).await?)
    }

    pub async fn get_content(
        &self,
        content: &content::Model,
    ) -> Result<RawContentValue, JsonRpcError> {
        match content.subprotocol {
            Subprotocol::History => {
                let content_info = HistoryNetworkApiClient::get_content(
                    &self.client,
                    HistoryContentKey::try_from_bytes(&content.content_key)?,
                )
                .await?;
                Ok(content_info.content)
            }
        }
    }

    pub async fn get_content_with_trace(
        &self,
        content: &content::Model,
    ) -> Result<(RawContentValue, QueryTrace), JsonRpcError> {
        match content.subprotocol {
            Subprotocol::History => {
                let trace_content_info = HistoryNetworkApiClient::trace_get_content(
                    &self.client,
                    HistoryContentKey::try_from_bytes(&content.content_key)?,
                )
                .await?;
                Ok((trace_content_info.content, trace_content_info.trace))
            }
        }
    }
}
