pragma solidity ^0.4.17;

contract Adoption {
    address[32] public adopters;
    // Adopting a pet
function adopt(uint petId) public returns (uint) {
  require(petId >= 0 && petId <= 31);

  adopters[petId] = msg.sender;

  return petId;
}
// Retrieving the adopters
function getAdopters() public view returns (address[32]) {
  return adopters;
}

}