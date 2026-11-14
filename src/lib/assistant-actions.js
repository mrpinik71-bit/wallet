// Every task the in-app assistant is allowed to carry out. The assistant's
// answer may only pick ids from this list; the home card runs the very same ids
// on the device, so the catalogue is the single source of truth for both sides.
export const SCREEN_ACTIONS = {
  open_home: { route: "/", help: "open the wallet overview", done: "Opened the wallet overview" },
  open_send: { route: "/send", help: "open the Send screen", done: "Opened Send" },
  open_receive: { route: "/receive", help: "open Receive with the address and QR code", done: "Opened Receive" },
  open_swap: { route: "/swap", help: "open the Swap screen", done: "Opened Swap" },
  open_markets: { route: "/markets", help: "open Markets", done: "Opened Markets" },
  open_activity: { route: "/activity", help: "open the transaction Activity", done: "Opened Activity" },
  open_browser: { route: "/browser", help: "open the dapps browser", done: "Opened Dapps" },
  open_security: {
    route: "/wallet",
    help: "open wallet security: recovery phrase, networks, lock and delete",
    done: "Opened wallet security",
  },
  open_checker: {
    route: "/checker",
    help: "open the recovery phrase checker",
    done: "Opened the phrase checker",
  },
};

export const TASK_ACTIONS = {
  refresh: { help: "reload every on-chain balance now", done: "Balances refreshed" },
  copy_address: { help: "copy the receiving address", done: "Address copied" },
  add_account: { help: "create the next account from the same phrase", done: "New account added" },
  switch_account: {
    help: "switch to another account; put the account number (1, 2, …) in arg",
    done: "Account switched",
  },
  lock_wallet: { help: "lock the vault right away", done: "Wallet locked" },
  voice_off: { help: "stop spoken replies", done: "Spoken replies off" },
  voice_on: { help: "speak replies aloud", done: "Spoken replies on" },
};

export const ALL_ACTIONS = { ...SCREEN_ACTIONS, ...TASK_ACTIONS };
export const ACTION_IDS = Object.keys(ALL_ACTIONS);