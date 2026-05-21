// SPDX-License-Identifier: CC0-1.0

use neurofhe_tfhe_rs::run_tfhe_sparse_classifier_json;

fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let result = run_tfhe_sparse_classifier_json()?;
    println!("{}", serde_json::to_string_pretty(&result)?);
    Ok(())
}
