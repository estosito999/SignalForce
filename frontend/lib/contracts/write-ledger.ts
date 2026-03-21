import { Abi, Address } from "viem";
import { BaseError, ContractFunctionExecutionError } from "viem";

interface EstimateGasParams {
  publicClient: {
    estimateContractGas: (args: {
      abi: Abi;
      address: Address;
      functionName: string;
      args?: readonly unknown[];
      account: Address;
      value?: bigint;
    }) => Promise<bigint>;
  };
  abi: Abi;
  address: Address;
  functionName: string;
  args?: readonly unknown[];
  account: Address;
  value?: bigint;
}

const GAS_BUFFER_PERCENT = 20n;
const HARD_GAS_CAP = 900000n;
const configuredGasCap = BigInt(process.env.NEXT_PUBLIC_TX_GAS_CAP || "500000");
const GAS_CAP = configuredGasCap > HARD_GAS_CAP ? HARD_GAS_CAP : configuredGasCap;

const DEFAULT_GAS_BY_FUNCTION: Record<string, bigint> = {
  recordPost: 350000n,
  recordComment: 400000n,
  recordSubscription: 300000n
};

function getDefaultGas(functionName: string): bigint {
  const fallback = DEFAULT_GAS_BY_FUNCTION[functionName] ?? 350000n;
  return fallback > GAS_CAP ? GAS_CAP : fallback;
}

export async function estimateBufferedGas({
  publicClient,
  abi,
  address,
  functionName,
  args,
  account,
  value
}: EstimateGasParams): Promise<bigint> {
  const estimatedGas = await publicClient.estimateContractGas({
    abi,
    address,
    functionName,
    args,
    account,
    value
  });

  const buffered = estimatedGas + (estimatedGas * GAS_BUFFER_PERCENT) / 100n;
  return buffered > GAS_CAP ? GAS_CAP : buffered;
}

export async function maybeEstimateBufferedGas(params: EstimateGasParams): Promise<bigint> {
  try {
    return await estimateBufferedGas(params);
  } catch {
    return getDefaultGas(params.functionName);
  }
}

export function extractWriteErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof BaseError) {
    if (error.shortMessage?.includes("HTTP request failed")) {
      return "Fallo la conexion RPC con Sepolia. Reintenta en unos segundos o cambia el RPC en .env.local.";
    }

    const executionError = error.walk((item) => item instanceof ContractFunctionExecutionError);
    if (executionError instanceof ContractFunctionExecutionError) {
      return executionError.shortMessage;
    }

    return error.shortMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}
