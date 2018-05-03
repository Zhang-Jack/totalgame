pragma solidity ^0.4.17;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/ItemToken.sol";

contract TestItemToken {
  ItemToken itemToken = ItemToken(DeployedAddresses.ItemToken());
  
// Testing the listMultipleItemsTest() function
function listMultipleItemsTest() public {

  
  //uint256[] memory itemIds; 
  var price_item;
  uint256 expected = 277777777777;

  /*for(uint i = 0; i < 32; i++){
    itemIds[i] = uint256(i);
  }*/

  //itemToken.listMultipleItems(itemIds, 77777777777, this);

  price_item = itemToken.priceOf(8);

  Assert.equal(price_item, expected, "List MultipleItemsTest passed.");
}

}