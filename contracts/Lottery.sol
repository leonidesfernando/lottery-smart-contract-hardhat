//SPDX-License-Identifier: MIT 

pragma solidity >=0.4.22 <0.9.0;

contract Lottery {
    uint constant private TICKET_PRICE = 0.5 ether;
    uint constant private MIN_PLAYERS = 3;

    struct TicketStruct{
        uint price;
        uint roundNumber;
        uint dateTime;
        address payable owner;
    }

    address public admin;

    address payable[] players;
    TicketStruct[] tickets;
    uint roundNumber = 0;


    mapping(uint => TicketStruct) public winningTickets;
    mapping(address => uint) public balances;

    enum BetsState{
        Open,
        Closed
    }

    event PurchasedLotteryTicket(address buyer, uint price);

    BetsState private status;

    constructor(){
        status = BetsState.Open;
    }

    function defineAdmin(address owner) public{
        admin = owner;
    }

    modifier restricted(){
        require(msg.sender == admin, 'The lottery smart contract can have only one owner/administrator.');
        _;
    }

    function bets(address payable[] memory gamblers) public payable{
        for(uint i = 0; i < gamblers.length; i++){
            bid(gamblers[i]);
        }
    }

    function bid(address payable player) public payable{
        require(status == BetsState.Open, 'Bets must be open to bet');
        require(player.balance > TICKET_PRICE, 'The minimum ticket price (lot) is 0.5 Ether.');
        require(player != admin, 'The administrator cannot participate as a user in the lottery');

        TicketStruct memory ticket = TicketStruct({
            price: TICKET_PRICE,
            roundNumber: roundNumber,
            dateTime: block.timestamp,
            owner: player
        });
        balances[player] += TICKET_PRICE;
        tickets.push(ticket);
        players.push(player);
        emit PurchasedLotteryTicket(player, TICKET_PRICE);
    }


    function pickWinner() public restricted{
        require(status == BetsState.Open, 'Bets must be open to make the draw');
        uint size = numOfPlayers();
        require(size > MIN_PLAYERS, 'A minimum of 3 users is required to participate in the lottery.');
        status = BetsState.Closed;
        uint index = random() % size;
        payable (tickets[index].owner).transfer(address(this).balance);
        winningTickets[roundNumber] = tickets[index];
        roundNumber++;
        initLottery();
    }

    function initLottery() private{
        status = BetsState.Open;
        delete tickets;
        players = new address payable[](0);
    }

    function random() private view returns(uint){
        return  uint (keccak256(abi.encode(block.timestamp,  players)));
    }

    function getBalance() public view returns (uint) {
        return address(this).balance/(10**18);
    }
   
    function numOfPlayers() public view returns (uint) {
        return players.length;
    }
   
   
    function getPlayers() public view returns (address payable[] memory) {
        return players;
    }

    function getAdmin() public view returns (address){
        return admin;
    }

    function getLastWinner() public view returns(uint, uint, uint, address payable) {
        require(roundNumber > 0, "At least one draw must be held to have a winner");
        TicketStruct memory winning = winningTickets[roundNumber-1];
        return (winning.price, winning.roundNumber, winning.dateTime, winning.owner);
    }
}