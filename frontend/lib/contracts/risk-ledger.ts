import { Address } from "viem";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

export const signalForceLedgerAbi = [
  {
    type: "event",
    name: "ActionAnchored",
    inputs: [
      { indexed: true, name: "actionId", type: "string" },
      { indexed: true, name: "parentId", type: "string" },
      { indexed: true, name: "author", type: "address" },
      { indexed: false, name: "contentHash", type: "bytes32" },
      { indexed: false, name: "actionType", type: "uint8" },
      { indexed: false, name: "timestamp", type: "uint256" }
    ]
  },
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
  },
  {
    type: "function",
    name: "paused",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "totalAnchors",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  }
] as const;

export const signalForceLedgerAddress =
  (process.env.NEXT_PUBLIC_SIGNAL_FORCE_CONTRACT_ADDRESS as Address | undefined) ||
  ZERO_ADDRESS;

const parsedChainId = Number(process.env.NEXT_PUBLIC_SIGNAL_FORCE_CHAIN_ID || "11155111");
export const signalForceChainId = Number.isFinite(parsedChainId) ? parsedChainId : 11155111;

export function hasValidContractAddress() {
  return signalForceLedgerAddress !== ZERO_ADDRESS;
}

export const riskLedgerAbi = signalForceLedgerAbi;
export const riskLedgerAddress = signalForceLedgerAddress;
