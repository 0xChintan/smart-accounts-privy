"use client";

import { ZeroXSwap } from "@/components/ZeroXSwap";
import { Zerodev } from "@/components/ZeroDev";
import { usePrivy } from "@privy-io/react-auth";

export default function Home() {
  const { ready, authenticated, user, login } = usePrivy();

  if (!ready) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!authenticated) {
    return (
      <div className="flex justify-center items-center h-screen ">
        <button
          onClick={() => login()}
          className="px-4 py-2 rounded-2xl bg-white text-black cursor-pointer"
        >
          Login
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col justify-center items-center h-screen gap-4">
      Address: {user?.wallet?.address}
      <Zerodev />
      <ZeroXSwap />
    </div>
  );
}
