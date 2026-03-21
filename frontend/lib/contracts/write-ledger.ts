import { Abi, Address } from "viem";
import { BaseError, ContractFunctionExecutionError } from "viem";

interface SimulateWriteParams {
  publicClient: {
    simulateContract: (args: {
      abi: Abi;
      address: Address;
      functionName: string;
      args?: readonly unknown[];
      account: Address;
      value?: bigint;
    }) => Promise<{ request: Record<string, unknown> }>;
  };
  abi: Abi;
  address: Address;
  functionName: string;
  args?: readonly unknown[];
  account: Address;
  value?: bigint;
}

export async function simulateLedgerContractRequest<TRequest>({
  publicClient,
  abi,
  address,
  functionName,
  args,
  account,
  value
}: SimulateWriteParams): Promise<TRequest> {
  const { request } = await publicClient.simulateContract({
    abi,
    address,
    functionName,
    args,
    account,
    value
  });

  const sanitizedRequest: Record<string, unknown> = { ...request };
  delete sanitizedRequest.gas;

  return sanitizedRequest as unknown as TRequest;
}

export function extractWriteErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof BaseError) {
    const executionError = error.walk((item) => item instanceof ContractFunctionExecutionError);
    if (executionError instanceof ContractFunctionExecutionError) {
      return executionError.shortMessage;
    }

    return error.shortMessage;
  }

  return error instanceof Error ? error.message : fallbackMessage;
}
