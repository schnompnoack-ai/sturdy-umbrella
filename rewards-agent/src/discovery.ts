import { JsonRpcProvider, getAddress, isAddress } from "ethers";

export type ChainConfig = { chainId: number; name: string; rpcUrl: string; explorerApiUrl?: string };
export type DiscoveryResult = { chainId: number; chain: string; address: string; balanceWei: string; blockNumber: number; status: "discovered" | "error"; error?: string };

export async function discoverWallet(address: string, chains: ChainConfig[]): Promise<DiscoveryResult[]> {
  if (!isAddress(address)) throw new Error("Invalid EVM address");
  const normalized = getAddress(address);
  return Promise.all(chains.map(async (chain) => {
    try {
      const provider = new JsonRpcProvider(chain.rpcUrl, chain.chainId, { staticNetwork: true });
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== chain.chainId) throw new Error("RPC chainId mismatch");
      const [balance, blockNumber] = await Promise.all([provider.getBalance(normalized), provider.getBlockNumber()]);
      return { chainId: chain.chainId, chain: chain.name, address: normalized, balanceWei: balance.toString(), blockNumber, status: "discovered" as const };
    } catch (e) {
      return { chainId: chain.chainId, chain: chain.name, address: normalized, balanceWei: "0", blockNumber: 0, status: "error" as const, error: e instanceof Error ? e.message : String(e) };
    }
  }));
}
