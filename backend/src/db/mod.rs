//! Database module for BlockSign backend
//!
//! This module provides SQLite database integration with connection pooling,
//! repository pattern for data access, and models for database entities.

pub mod pool;
pub mod models;
pub mod repositories;
pub mod migrations;

pub use pool::create_pool;
pub use migrations::run_migrations;
