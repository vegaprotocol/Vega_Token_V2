//SPDX-License-Identifier: MIT
pragma solidity 0.8.1;

import "./IERC20.sol";

contract ERC20_Vesting {
  address controller;

  uint8 tranche_count = 1;
  mapping(address => bool) v1_migrated;
  mapping(address=> user_stat) user_stats;

  uint256 public total_locked;
  address public v1_address; // mainnet = 0xD249B16f61cB9489Fe0Bb046119A48025545b58a;
  address public v2_address;
  uint256 constant accuracy_scale = 100000000000;

  constructor(address token_v1_address, address token_v2_address) {
    v1_address = token_v1_address;
    total_locked = IERC20(token_v1_address).totalSupply() - IERC20(token_v1_address).balanceOf(token_v1_address);
    v2_address = token_v2_address;
    controller = msg.sender;
    emit Controller_Set(controller);
  }

  event Lien_Applied(address indexed user, uint256 amount);
  event Tokens_Withdrawn(address indexed user, uint8 tranche_id, uint256 amount);
  event Tranche_Created(uint8 indexed tranche_id, uint256 cliff_start, uint256 duration);
  event Tranche_Balance_Added(address indexed user, uint8 indexed tranche_id, uint256 amount);
  event Tranche_Balance_Removed(address indexed user, uint8 indexed tranche_id, uint256 amount);

  event Stake_Deposited(address indexed user, uint256 amount, bytes32 vega_public_key);
  event Stake_Removed(address indexed user, uint256 amount);
  event Stake_Removed_In_Anger(address indexed user, uint256 amount);

  event Issuer_Permitted(address indexed issuer, uint256 amount);
  event Issuer_Revoked(address indexed issuer);

  event Controller_Set(address indexed new_controller);

  struct tranche_balance {
      uint256 total_deposited;
      uint256 total_claimed;
  }

  struct user_stat {
    uint256 total_in_all_tranches;
    uint256 lien;
    mapping (uint8 => tranche_balance) tranche_balances;
  }
  struct tranche {
    uint256 cliff_start;
    uint256 duration;
  }

  mapping(uint8 => tranche) public tranches;
  mapping(address => uint256) public permitted_issuance;

  //note tranche zero is perma-locked
  function create_tranche(uint256 cliff_start, uint256 duration) public only_controller {
    tranches[tranche_count] = tranche(cliff_start, duration);
    emit Tranche_Created(tranche_count, cliff_start, duration);
    //sol 0.8 comes with auto-overflow protection
    tranche_count++;
  }

  function issue_into_tranche(address user, uint8 tranche_id, uint256 amount) public controller_or_issuer {
    if(permitted_issuance[msg.sender] > 0){
      //is issuer
      require(permitted_issuance[msg.sender] >= amount, "not enough permitted balance");
      require(user != msg.sender, "cannot issue to self");
      permitted_issuance[msg.sender] -= amount;
    }

    require(tranche_id < tranche_count, "tranche_id out of bounds");
    require( IERC20(v2_address).balanceOf(address(this)) - (total_locked + amount) >= 0, "contract token balance low" );
    //once assigned to a tranche, they can never be clawed back, but that can be reassigned IFF they are in tranche_id:0

    if(!v1_migrated[user]){
      //stops this check from happening in get_tranche_balance
      uint256 bal = v1_bal(user);
      user_stats[user].tranche_balances[0].total_deposited += bal;
      user_stats[user].total_in_all_tranches += bal;
      v1_migrated[user] = true;
    }

    // issue into tranche
    user_stats[user].tranche_balances[tranche_id].total_deposited += amount;
    user_stats[user].total_in_all_tranches += amount;
    total_locked += amount;
    emit Tranche_Balance_Added(user, tranche_id, amount);
  }
  function move_into_tranche(address user, uint8 tranche_id, uint256 amount) public only_controller {
    /// @notice can only be moved from tranche 0
    require(tranche_id > 0 && tranche_id < tranche_count);

    if(!v1_migrated[user]){
      //stops this check from happening in get_tranche_balance
      uint256 bal = v1_bal(user);
      user_stats[user].tranche_balances[0].total_deposited += bal;
      user_stats[user].total_in_all_tranches += bal;
      v1_migrated[user] = true;
    }

    //check balance
    require(user_stats[user].tranche_balances[0].total_deposited >= amount);
    // move into tranche
    user_stats[user].tranche_balances[0].total_deposited -= amount;
    user_stats[user].tranche_balances[tranche_id].total_deposited += amount;
    emit Tranche_Balance_Removed(user, 0, amount);
    emit Tranche_Balance_Added(user, tranche_id, amount);

  }

  function get_tranche_balance(address user, uint8 tranche_id) public view returns(uint256) {
    if(tranche_id == 0 && !v1_migrated[user]){
      //todo refer to token V1 if user
      return v1_bal(user);
    } else {
      return user_stats[user].tranche_balances[tranche_id].total_deposited - user_stats[user].tranche_balances[tranche_id].total_claimed;
    }
  }
  /*
      //accuracy_scale/2 == 50%
      uint256 percentage_unlocked = (accuracy_scale * (now - tranches[tranche_id].cliff_start)) / tranches[tranche_id].duration;
      uint256 vested = (percentage_unlocked * user_stats[user].tranche_balances[tranche_id].total_deposited) / accuracy_scale;
      uint256 available_vested = vested - user_stats[user].tranche_balances[tranche_id].total_claimed;
      uint256 available_for_withdraw = available_vested - user_stats[user].lien;
  */
  function get_vested_for_tranche(address user, uint8 tranche_id) public view returns(uint256) {

    if(block.timestamp < tranches[tranche_id].cliff_start){
      return 0;
    }
    else if(block.timestamp > tranches[tranche_id].cliff_start + tranches[tranche_id].duration || tranches[tranche_id].duration == 0){
      return user_stats[user].tranche_balances[tranche_id].total_deposited -  user_stats[user].tranche_balances[tranche_id].total_claimed;
    } else {
      return (((( accuracy_scale * (block.timestamp - tranches[tranche_id].cliff_start) )  / tranches[tranche_id].duration
          ) * user_stats[user].tranche_balances[tranche_id].total_deposited
        ) / accuracy_scale ) - user_stats[user].tranche_balances[tranche_id].total_claimed;
    }
  }

  function v1_bal(address user) internal view returns(uint256) {
    if(!v1_migrated[user]){
      return IERC20(v1_address).balanceOf(user);
    } else {
      return 0;
    }
  }
  function user_total_all_tranches(address user) public view returns(uint256){
    return user_stats[user].total_in_all_tranches + v1_bal(user);
  }

  function withdraw_from_tranche(uint8 tranche_id) public {
    require(tranche_id != 0);
    uint256 to_withdraw = get_vested_for_tranche(msg.sender, tranche_id);

    require(user_stats[msg.sender].total_in_all_tranches - to_withdraw >=  user_stats[msg.sender].lien);
    user_stats[msg.sender].tranche_balances[tranche_id].total_claimed += to_withdraw;
    user_stats[msg.sender].total_in_all_tranches -= to_withdraw;
    total_locked -= to_withdraw;
    require(IERC20(v2_address).transfer(msg.sender, to_withdraw));
    emit Tranche_Balance_Removed(msg.sender, tranche_id, to_withdraw);
  }

  function stake_tokens(uint256 amount, bytes32 vega_public_key) public {
    require(user_stats[msg.sender].lien + amount > user_stats[msg.sender].lien);
    require(user_total_all_tranches(msg.sender) >= user_stats[msg.sender].lien + amount);
    //user applies this to themselves which only multisig control can remove
    user_stats[msg.sender].lien += amount;
    emit Stake_Deposited(msg.sender, amount, vega_public_key);
  }
  function remove_stake(uint256 amount) public {
    //TODO add multisig_control IFF needed
    user_stats[msg.sender].lien -= amount;
    emit Stake_Removed(msg.sender, amount);
  }
  function permit_issuer(address issuer, uint256 amount) public only_controller {
    /// @notice revoke is required first to stop a simple double allowance attack
    require(permitted_issuance[issuer] == 0, "issuer already permitted, revoke first");
    require(controller != issuer, "controller cannot be permitted issuer");
    permitted_issuance[issuer] = amount;
    emit Issuer_Permitted(issuer, amount);
  }
  function revoke_issuer(address issuer) public only_controller {
    require(permitted_issuance[issuer] != 0, "issuer already revoked");
    permitted_issuance[issuer] = 0;
    emit Issuer_Revoked(issuer);
  }

  function set_controller(address new_controller) public only_controller {
    controller = new_controller;
    permitted_issuance[new_controller] = 0;
    emit Controller_Set(new_controller);
  }

  modifier only_controller {
         require( msg.sender == controller, "not controller" );
         _;
  }
  modifier controller_or_issuer {
         require( msg.sender == controller || permitted_issuance[msg.sender] > 0,"not controller or issuer" );
         _;
  }
}



/**
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMWEMMMMMMMMMMMMMMMMMMMMMMMMMM...............MMMMMMMMMMMMM
MMMMMMLOVEMMMMMMMMMMMMMMMMMMMMMM...............MMMMMMMMMMMMM
MMMMMMMMMMHIXELMMMMMMMMMMMM....................MMMMMNNMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMM....................MMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMM88=........................+MMMMMMMMMM
MMMMMMMMMMMMMMMMM....................MMMMM...MMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMM....................MMMMM...MMMMMMMMMMMMMMM
MMMMMMMMMMMM.........................MM+..MMM....+MMMMMMMMMM
MMMMMMMMMNMM...................... ..MM?..MMM.. .+MMMMMMMMMM
MMMMNDDMM+........................+MM........MM..+MMMMMMMMMM
MMMMZ.............................+MM....................MMM
MMMMZ.............................+MM....................MMM
MMMMZ.............................+MM....................DDD
MMMMZ.............................+MM..ZMMMMMMMMMMMMMMMMMMMM
MMMMZ.............................+MM..ZMMMMMMMMMMMMMMMMMMMM
MM..............................MMZ....ZMMMMMMMMMMMMMMMMMMMM
MM............................MM.......ZMMMMMMMMMMMMMMMMMMMM
MM............................MM.......ZMMMMMMMMMMMMMMMMMMMM
MM......................ZMMMMM.......MMMMMMMMMMMMMMMMMMMMMMM
MM............... ......ZMMMMM.... ..MMMMMMMMMMMMMMMMMMMMMMM
MM...............MMMMM88~.........+MM..ZMMMMMMMMMMMMMMMMMMMM
MM.......$DDDDDDD.......$DDDDD..DDNMM..ZMMMMMMMMMMMMMMMMMMMM
MM.......$DDDDDDD.......$DDDDD..DDNMM..ZMMMMMMMMMMMMMMMMMMMM
MM.......ZMMMMMMM.......ZMMMMM..MMMMM..ZMMMMMMMMMMMMMMMMMMMM
MMMMMMMMM+.......MMMMM88NMMMMM..MMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMM+.......MMMMM88NMMMMM..MMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM*/
