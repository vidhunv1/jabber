use std::cell::RefCell;
use std::rc::Rc;

use jabber::instruction::{cancel_order, close_market, consume_events, new_order};
use jabber::state::{EventQueue, EventQueueHeader, SelfTradeBehavior, Side};
use jabber::state::{MarketState, OrderSummary};
use jabber::{msrm_token, CRANKER_REWARD};
use borsh::BorshDeserialize;
use solana_program::program_option::COption;
use solana_program::program_pack::Pack;
use solana_program::pubkey::Pubkey;
use solana_program::system_instruction::{create_account, transfer};
use solana_program::system_program;
use solana_program_test::{processor, ProgramTest};
use solana_sdk::account::Account;
use solana_sdk::signature::Keypair;
use solana_sdk::signature::Signer;
pub mod common;
use crate::common::utils::{create_market_and_accounts, sign_send_instructions};

#[tokio::test]
async fn test_jabber(){
        // Create program and test environment
        let jabber_program_id = Pubkey::new_unique();

        let mut program_test = ProgramTest::new(
            "jabber",
            jabber_program_id,
            processor!(jabber::entrypoint::process_instruction),
        );
    
        // Create test context
        let mut prg_test_ctx = program_test.start_with_context().await;

        // Create receiver
        let receiver_account = Keypair::new();

        // Create profile
        


        // Create thread


        // Send message


        // Read message
}