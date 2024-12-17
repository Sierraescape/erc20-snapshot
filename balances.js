"use strict";
const enumerable = require("linq");

module.exports.createBalances = async data => {
  const balances = new Map();
  const closingBalances = [];

  const setDeposits = event => {
    const wallet = event.to;

    let deposits = (balances.get(wallet) || {}).deposits || 0n;
    let withdrawals = (balances.get(wallet) || {}).withdrawals || 0n;

    if (event.value) {
      deposits = deposits + BigInt(event.value);
      balances.set(wallet, { deposits, withdrawals });
    }
  };

  const setWithdrawals = event => {
    const wallet = event.from;

    let deposits = (balances.get(wallet) || {}).deposits || 0n;
    let withdrawals = (balances.get(wallet) || {}).withdrawals || 0n;

    if (event.value) {
      withdrawals = withdrawals + BigInt(event.value);
      balances.set(wallet, { deposits, withdrawals });
    }
  };

  for (const event of data.events) {
    setDeposits(event);
    setWithdrawals(event);
  }

  for (const [key, value] of balances.entries()) {
    if (key === "0x0000000000000000000000000000000000000000") {
      continue;
    }

    const balance = value.deposits - value.withdrawals;

    closingBalances.push({
      wallet: key,
      balance
    });
  }

  return enumerable
    .from(closingBalances)
    .orderByDescending(x => x.balance)
    .toArray();
};
