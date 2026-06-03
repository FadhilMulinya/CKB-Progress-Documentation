# Week 11
### Wallet Behaviour Intelligence on Nervos CKB

## What I explored

I explored the feasibility of identifying suspicious wallets or non-human like behaviour on Nervos CKB by observing behavioural signals over time. While individual transactions can be checked for validity, analyzing wallet activity sequences can help distinguish human users from automated or malicious actors or exchanges. To achieve this in a privacy-preserving manner, I researched and designed a data collection pipeline coupled with federated learning architectures together with a team member for this product.


This module will be directly integrated into https://mosaicafrica.xyz as  a wallet intelligence engine for ckb


## What I did

- Designed a CKB Node Extraction module to query block and transaction data directly from node RPC endpoints.
- Integrated the CKB Explorer API to enrich raw node data with indexed transaction histories and address-level metrics.
- Developed a feature engineering specification focusing on temporal dynamics (transaction frequency, burstiness) and network structure.
- Explored graph representation approaches for CKB transactions to map relationships and flow patterns.
- Researched federated learning architectures using the Flower (`flwr`) framework to allow multi-party training without centralizing raw transactions.

## Why this matters

Traditional fraud detection relies on centralizing transaction data, which creates privacy risks and single points of failure. By utilizing federated learning, participating nodes and institutions can build a collaborative intelligence model to identify malicious wallets while keeping their raw data local and private, aligning with the decentralized spirit of Nervos CKB.

## Highlights

### Ingestion & Feature Engineering Architecture

- **CKB Node Extractor**: Collects raw capacity movements, cell dependencies, and activity timelines directly from the RPC interface.
- **CKB Explorer Rich Data**: Indexes and queries address summaries and historical sequences to accelerate feature creation.
- **Temporal Features**: Measures transaction intervals, activity distribution, and frequency consistency.
- **Graph Features**: Extracts network graphs containing address relationships, clustering, and centrality metrics.

### Federated Learning Layer

- **Flower (flwr) Client/Server**: Aggregates local model updates instead of centralizing raw data.
- **Privacy-Preserving Aggregation**: Combines updates to improve the shared model while ensuring user transaction logs remain local.

## Repositories

- **Data Intelligence Layer**: [ckb-intel-node](https://github.com/buidlabz/ckb-intel-node)
  - *Focus*: Node-based extraction, Explorer API integration, and dataset creation.
- **Federated Intelligence Layer**: [ckb-intelligence](https://github.com/buidlabz/ckb-intelligence)
  - *Focus*: Client-server setups, Flower integration, and federated aggregation logic.

## What I learned

- Fraud detection is most effective when observing behavioural patterns across time and networks, rather than analyzing isolated transactions.
- The unique Cell Model of Nervos CKB provides rich structural signals (inputs, outputs, scripts) that can form unique wallet signatures.
- Federated learning offers a viable, privacy-preserving alternative to centralized data pooling for multi-party threat analysis.

## Next steps

- Complete the integration between the node data extraction pipeline and the federated client.
- Generate synthetic CKB transaction datasets to test local feature engineering scripts.
- Implement and run initial federated training simulations with multiple local clients using Flower.
