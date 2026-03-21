import { Address } from "viem";

export const signalForceLedgerAbi = [
  {
    type: "function",
    name: "recordPost",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "postId",
        type: "string"
      },
      {
        name: "postHash",
        type: "bytes32"
      }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "recordComment",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "commentId",
        type: "string"
      },
      {
        name: "postId",
        type: "string"
      },
      {
        name: "commentHash",
        type: "bytes32"
      }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "recordReputationCheckpoint",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "wallet",
        type: "address"
      },
      {
        name: "reputationScore",
        type: "uint256"
      },
      {
        name: "rank",
        type: "string"
      }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "recordSubscription",
    stateMutability: "payable",
    inputs: [
      {
        name: "creator",
        type: "address"
      }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getMyAnchors",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "actionId", type: "string" },
          { name: "parentId", type: "string" },
          { name: "author", type: "address" },
          { name: "contentHash", type: "bytes32" },
          { name: "actionType", type: "uint8" },
          { name: "timestamp", type: "uint256" }
        ]
      }
    ]
  }
] as const;

export const signalForceLedgerAddress =
  (process.env.NEXT_PUBLIC_SIGNAL_FORCE_CONTRACT_ADDRESS as Address | undefined) ||
  (process.env.NEXT_PUBLIC_RISK_LEDGER_CONTRACT_ADDRESS as Address | undefined) ||
  ("0x0000000000000000000000000000000000000000" as Address);

export function hasValidContractAddress() {
  return signalForceLedgerAddress !== "0x0000000000000000000000000000000000000000";
}

export const riskLedgerAbi = signalForceLedgerAbi;
export const riskLedgerAddress = signalForceLedgerAddress;
