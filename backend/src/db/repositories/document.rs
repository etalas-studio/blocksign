//! Document repository for database operations
//!
//! Provides CRUD operations for documents stored in the database.

use super::super::models::{Document, NewDocument, UpdateDocument};
use anyhow::{Context, Result};
use sqlx::{Pool, Sqlite};

/// Repository for document database operations
pub struct DocumentRepository {
    pool: Pool<Sqlite>,
}

impl DocumentRepository {
    /// Creates a new DocumentRepository
    pub fn new(pool: Pool<Sqlite>) -> Self {
        Self { pool }
    }

    /// Creates a new document in the database
    pub async fn create(&self, document: &NewDocument) -> Result<Document> {
        let query = r#"
            INSERT INTO documents (
                document_hash, ipfs_hash, file_name, file_size,
                content_type, storage_path, uploader_wallet, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *
        "#;

        let doc = sqlx::query_as::<_, Document>(query)
            .bind(&document.document_hash)
            .bind(&document.ipfs_hash)
            .bind(&document.file_name)
            .bind(document.file_size)
            .bind(&document.content_type)
            .bind(&document.storage_path)
            .bind(&document.uploader_wallet)
            .bind(&document.metadata)
            .fetch_one(&self.pool)
            .await
            .context("Failed to create document")?;

        Ok(doc)
    }

    /// Finds a document by its hash
    pub async fn find_by_hash(&self, hash: &str) -> Result<Option<Document>> {
        let query = "SELECT * FROM documents WHERE document_hash = ?";

        let doc = sqlx::query_as::<_, Document>(query)
            .bind(hash)
            .fetch_optional(&self.pool)
            .await
            .context("Failed to find document by hash")?;

        Ok(doc)
    }

    /// Finds a document by its ID
    pub async fn find_by_id(&self, id: i64) -> Result<Option<Document>> {
        let query = "SELECT * FROM documents WHERE id = ?";

        let doc = sqlx::query_as::<_, Document>(query)
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .context("Failed to find document by id")?;

        Ok(doc)
    }

    /// Lists documents by uploader wallet with pagination
    pub async fn list_by_wallet(
        &self,
        wallet: &str,
        limit: usize,
        offset: usize,
    ) -> Result<Vec<Document>> {
        let query = r#"
            SELECT * FROM documents
            WHERE uploader_wallet = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        "#;

        let docs = sqlx::query_as::<_, Document>(query)
            .bind(wallet)
            .bind(limit as i64)
            .bind(offset as i64)
            .fetch_all(&self.pool)
            .await
            .context("Failed to list documents by wallet")?;

        Ok(docs)
    }

    /// Lists all documents with pagination
    pub async fn list_all(&self, limit: usize, offset: usize) -> Result<Vec<Document>> {
        let query = r#"
            SELECT * FROM documents
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        "#;

        let docs = sqlx::query_as::<_, Document>(query)
            .bind(limit as i64)
            .bind(offset as i64)
            .fetch_all(&self.pool)
            .await
            .context("Failed to list all documents")?;

        Ok(docs)
    }

    /// Updates a document
    pub async fn update(&self, id: i64, update: &UpdateDocument) -> Result<Option<Document>> {
        let mut query_set = Vec::new();
        let mut bind_idx = 1;

        if update.ipfs_hash.is_some() {
            query_set.push(format!("ipfs_hash = ?{}", bind_idx));
            bind_idx += 1;
        }
        if update.metadata.is_some() {
            query_set.push(format!("metadata = ?{}", bind_idx));
            bind_idx += 1;
        }

        if query_set.is_empty() {
            return self.find_by_id(id).await;
        }

        query_set.push("updated_at = CURRENT_TIMESTAMP".to_string());

        let query_str = format!(
            "UPDATE documents SET {} WHERE id = ? RETURNING *",
            query_set.join(", ")
        );

        let mut query = sqlx::query_as::<_, Document>(&query_str);

        if let Some(ipfs_hash) = &update.ipfs_hash {
            query = query.bind(ipfs_hash);
        }
        if let Some(metadata) = &update.metadata {
            query = query.bind(metadata);
        }
        query = query.bind(id);

        let doc = query
            .fetch_optional(&self.pool)
            .await
            .context("Failed to update document")?;

        Ok(doc)
    }

    /// Deletes a document by ID
    pub async fn delete(&self, id: i64) -> Result<bool> {
        let result = sqlx::query("DELETE FROM documents WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await
            .context("Failed to delete document")?;

        Ok(result.rows_affected() > 0)
    }

    /// Counts total documents
    pub async fn count(&self) -> Result<i64> {
        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM documents")
            .fetch_one(&self.pool)
            .await
            .context("Failed to count documents")?;

        Ok(count.0)
    }

    /// Counts documents by uploader wallet
    pub async fn count_by_wallet(&self, wallet: &str) -> Result<i64> {
        let count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM documents WHERE uploader_wallet = ?")
            .bind(wallet)
            .fetch_one(&self.pool)
            .await
            .context("Failed to count documents by wallet")?;

        Ok(count.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[sqlx::test]
    async fn test_create_and_find_document(pool: Pool<Sqlite>) {
        let repo = DocumentRepository::new(pool);

        let new_doc = NewDocument {
            document_hash: "0x1234567890abcdef".to_string(),
            ipfs_hash: None,
            file_name: "test.pdf".to_string(),
            file_size: 1024,
            content_type: "application/pdf".to_string(),
            storage_path: "/tmp/test.pdf".to_string(),
            uploader_wallet: "0xabc123".to_string(),
            metadata: None,
        };

        let created = repo.create(&new_doc).await.unwrap();
        assert_eq!(created.document_hash, "0x1234567890abcdef");

        let found = repo.find_by_hash("0x1234567890abcdef").await.unwrap();
        assert!(found.is_some());
        assert_eq!(found.unwrap().file_name, "test.pdf");
    }
}
