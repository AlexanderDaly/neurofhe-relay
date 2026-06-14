// SPDX-License-Identifier: CC0-1.0

use neurofhe_tfhe_rs::{run_tfhe_real_data_classifier_json, run_tfhe_sparse_classifier_json};

fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let args: Vec<String> = std::env::args().collect();
    let input_path = args
        .iter()
        .position(|arg| arg == "--input")
        .and_then(|index| args.get(index + 1));
    let result = match input_path {
        Some(path) => run_tfhe_real_data_classifier_json(path)?,
        None => run_tfhe_sparse_classifier_json()?,
    };
    println!("{}", serde_json::to_string_pretty(&result)?);
    Ok(())
}
