# VEGA Token V2
This repository contains all of the smart contracts and tests for both VEGA Token V2 and ERC20 Vesting. VEGA V2 is the replacement ERC20 token used for staking and governance on the Vega network. It replaces an earlier V1 token that was issued to early investors and contained a single unlock mechanism. V2 and Vesting was created to allow for multiple "vesting tranches" that linearly unlock tokens over time. This allows different investor classes and holders to be assigned different unlock schedules in a way that is provably and securely issued to the target investor/holder.

## VEGA Token
### Standard ERC20 Token
The core of VEGA V2 is the standard [OpenZeppelin ERC20 contract](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol) with only a single custom function: Mint Lock.

For functions and more details on ERC20, see the official (Ethereum Improvement Proposal's EIP-20 documentation)[https://eips.ethereum.org/EIPS/eip-20]

### Mint Lock
Just about every aspect of Vega Protocol is controlled by governance (enabled by VEGA tokens) and as such the community should be able to increase the token supply as necessary through governance actions. While this is a potential action they can take, more VEGA V2 tokens cannot be minted until the mint lock expires at Sunday, December 31, 2023 11:59:59 PM GMT (timestamp 1704067199). This date was selected to be after all currently planned vesting is complete.

## ERC20 Vesting
The ERC20 Vesting contract holds all of the initial 64m+ VEGA tokens and manages their vesting and withdrawals. The contract allows permitted issuers to issuer any number of VEGA tokens (provided there is still an unissued balance) to a target Ethereum address into a provided tranche which will unlock according to that tranche's particular schedule. This contract also manages staking of locked VEGA token by implementing the IStake interface. Since Vega token v1 has been replaced by v2, all v1 balances are automatically issued into a non-vesting "tranche 0" which can never be taken from the holder, but must be issued into an appropriate vesting tranche before being withdrawn.

Events:
* `Tranche_Created(uint8 indexed tranche_id, uint256 cliff_start, uint256 duration)`
* `Tranche_Balance_Added(address indexed user, uint8 indexed tranche_id, uint256 amount)`
* `Tranche_Balance_Removed(address indexed user, uint8 indexed tranche_id, uint256 amount)`
* `Issuer_Permitted(address indexed issuer, uint256 amount)`
* `Issuer_Revoked(address indexed issuer)`
* `Controller_Set(address indexed new_controller)`

Views:
* `total_locked()` - returns the total amount of tokens "on" this contract that are locked into a tranche
* `v1_address()` - returns the address for Vega's v1 ERC20 token
* `v2_address()` - returns the address for Vega's v2 ERC20 token that replaces v1
* `accuracy_scale()` - returns the multiplier to assist in integer division (Solidity is dumb)
* `default_tranche_id()` - returns the tranche_id for the default tranche
* `address_migration(address v1_address)` - returns mapping of new address => old address for a 1-time v1->v2 mapping completed when contract was deployed
* `tranches(uint8 tranche_id)` - returns the tranche details for given tranche_id (cliff_start and duration)
* `permitted_issuance(address issuer)` - returns the amount of tokens the issuer is permitted to issue, this is reduced with every issue transaction
* `get_tranche_balance(address user, uint8 tranche_id)` - returns the amount of VEGA locked in target tranche for provided user address
* `get_vested_for_tranche(address user, uint8 tranche_id)` - returns the amount of VEGA in target tranche for provided user address that is vested and ready for withdrawal
* `v1_bal(address user)` - returns the v1 balance for the given user. Returns zero if the balance has been "migrated" by having tokens issued into a tranche
* `user_total_all_tranches(address user)` - returns the total amount of tokens in all tranches (vested or locked) that have yet to be withdrawn


Functions:
* `create_tranche(uint256 cliff_start, uint256 duration)` - Allows controller (admin) to create a new tranche
* `issue_into_tranche(address user, uint8 tranche_id, uint256 amount)` - Allows issuer or controller to issue tokens into the given tranche
* `move_into_tranche(address user, uint8 tranche_id, uint256 amount)` - Allows controller to move Vega from the default tranche into the provided tranche, tokens must be in default tranche first
* `withdraw_from_tranche(uint8 tranche_id)` - Allows a user to withdraw any vested tokens to their Ethereum address from the given tranche. This will fail if "user_total_all_tranches" - "amount" is less than total - staked tokens
* `assisted_withdraw_from_tranche(uint8 tranche_id, address target)` - Allows controller to run the withdraw on behalf of given target address in case of user having a dApp-incompatible ETH wallet. For emergency use only.
* `stake_tokens(uint256 amount, bytes32 vega_public_key)` - Stakes tokens (see IStake below)
* `remove_stake(uint256 amount, bytes32 vega_public_key)` - Unstakes tokens (see IStake below)
* `permit_issuer(address issuer, uint256 amount)` - Allows the controller to permit an Ethereum address to issue VEGA into tranches for users
* `revoke_issuer(address issuer)` - Allows the controller to revoke a given issuer
* `set_controller(address new_controller)` - Allows the controller to hand over control to another Ethereum address


## IStake Interface
The IStake interface contains the events and a couple helper views that every staking contract must implement to be compatible.
ERC20_Vesting smart contract implements this interface.

Events:
* `Stake_Deposited(address indexed user, uint256 amount, bytes32 indexed vega_public_key)`
* `Stake_Removed(address indexed user, uint256 amount, bytes32 indexed vega_public_key)`
* `Stake_Transferred(address indexed from, uint256 amount, address indexed to, bytes32 indexed vega_public_key)`

Views:
* `staking_token()` - returns the address of the token that is able to be staked in the implementing contract
* `stake_balance(address target, bytes32 vega_public_key)` - returns the number of tokens staked for that target address and vega_public_key pair
* `total_staked()` - returns the total tokens staked from all users in the implementing contract


## Deployment Details
### Mainnet Ethereum
* VEGA V1 Token (burned owner): 0xd249b16f61cb9489fe0bb046119a48025545b58a
* VEGA V2 Token: 0xcB84d72e61e383767C4DFEb2d8ff7f4FB89abc6e
* ERC20 Vesting: 0x23d1bFE8fA50a167816fBD79D7932577c06011f4

Tranches:
[Tranche ID, Name, Start, Duration]
* ID 1: Team A tokens,1646438400,39484800
* ID 2: Team B tokens,1654387200,47347200
* ID 3: Seed and F&F investors,1636070400,47174400
* ID 4: Private Round Reg S,1633392000,47260800
* ID 5: Coinlist op 1/Whitelist/12+12,1654387200,31536000
* ID 6: Coinlist option 2,1638662400,15724800
* ID 7: Coinlist option 3,1630627200,0
* ID 8: Seed and F&F initial unlock,1636070400,0
* ID 9: Private Round initial unlock,1633392000,0


### Roptsten Ethereum Testnet
* VEGA Token: 0x16480156222D4525f02F0F2BdF8A45A23bd26431
* ERC20 Vesting: 0x08C06ECDCf9b8f45e3cF1ec29B82eFd0171341D9

## Tests
* `ganache-cli`
* `truffle test`
