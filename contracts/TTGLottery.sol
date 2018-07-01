pragma solidity ^0.4.15;
//import "./strings.sol";

library SafeMathLib {

  function times(uint a, uint b) internal pure returns (uint) {
    uint c = a * b;
    require(a == 0 || c / a == b);
    return c;
  }

  function minus(uint a, uint b) internal pure returns (uint) {
    require(b <= a);
    return a - b;
  }

  function plus(uint a, uint b) internal pure returns (uint) {
    uint c = a + b;
    require(c>=a);
    return c;
  }
  function mul(uint a, uint b) internal pure returns (uint) {
    uint c = a * b;
    require(a == 0 || c / a == b);
    return c;
  }

  function div(uint a, uint b) internal pure returns (uint) {
    require(b > 0);
    uint c = a / b;
    require(a == b * c + a % b);
    return c;
  }

  function sub(uint a, uint b) internal pure returns (uint) {
    require(b <= a);
    return a - b;
  }

  function add(uint a, uint b) internal pure returns (uint) {
    uint c = a + b;
    require(c>=a && c>=b);
    return c;
  }

}

contract Ownable {
  address public owner;
  mapping (address => bool) private admins;

  function Ownable() internal {
    owner = msg.sender;
  }

  modifier onlyAdmins(){
    require(admins[msg.sender]);
    _;
  }

  modifier onlyOwner()  {
    require (msg.sender == owner);
    _;
  }

 function getOwner() view public returns (address){
     return owner;
  }

 function addAdmin (address _admin) onlyOwner() public {
    admins[_admin] = true;
  }

 function removeAdmin (address _admin) onlyOwner() public {
    delete admins[_admin];
  }
}


interface ITTGCoin {
  function recycle(address from, uint amount) external;
  function balanceOf(address who) external constant returns (uint);
  function addAdmin (address _admin)  public ;
  function airDrop(address transmitter, address receiver, uint amount) public  returns (uint actual); 
  function transferFrom(address _from, address _to, uint _value) public returns (bool success);
}

contract TTGLottery  is Ownable{
    //using strings for *;
    bytes32 public name = 'TTGLottery -TTG earn ETH Lottery';

	enum Status {
        INIT,	 		
		PLAYING,	
        PLAYED,
        FREEZING,   
		TERMINATED   
	}

 	struct Game {
         uint256 gameId;

         uint256  jackpot;
         uint256  create_block;
         uint256  result_block;
         bytes32  result_hash;

         address  lucky;//lucky man
         address  creator;
         uint32  luckyId;
         uint  limit;
         uint  sum;
         uint32  counts;
         uint32  max_cnts;

         uint ethBalance;//ETH award

        address[] bettings;
        Status state;
        uint32 gtype;
	}

	Game[] private games;
    uint private totalETHInBet;
    uint private totalTTGInBet;

    ITTGCoin private ttgCoin;
    mapping (address => bool) private hasAirdrop;

    using SafeMathLib for uint;
    
    event Result(uint256 gameId, address lucky, uint32 luckyId);
    event LotteryAdd(uint256 gameId, Status _state);
    event Open(uint256 gameId, Status _state);
    event AirDrop(address from, address to, uint amount);

    event Play(address _sender, uint256  tonkeyId, uint256 _time);
    event Destroy();
    event TakeLuckyHome(address _address, uint256 _amount);

    function TTGLottery()  public {
         owner = msg.sender;
         addAdmin(owner);
    }

    function lotteryRemove (uint256 _gameId) public onlyAdmins {
        delete games[_gameId];
    }

    function airDrop() public returns (uint actual){

        require(hasAirdrop[msg.sender]==false);
        //airDrop 100 whole TTG per user for the first time 
        uint amount = 100*10**18;

        ttgCoin.airDrop(this, msg.sender, amount);

        hasAirdrop[msg.sender] = true;

        AirDrop(this, msg.sender, amount);

    }

    function lotteryAdd(uint32 _type, uint256 _limit, uint256 _jackpot, uint32 _max_cnts) public onlyAdmins returns (uint256 _gameId) {
         
        Game memory _game;

        _game.state = Status.PLAYING;
        _game.create_block = block.number;//区块数
        _game.jackpot = _jackpot;

        _game.limit = _limit;  //额度限制
        _game.sum = 0;         //当前总额
        _game.counts = 0;      //当前投票人数
        _game.max_cnts = _max_cnts;  //最大参与数
        _game.gtype = _type;
        _game.creator = msg.sender;

        _game.gameId = games.length;

        uint256 newGameId = games.push(_game) - 1;

        require(_game.gameId == newGameId);

        emit  LotteryAdd(_game.gameId, _game.state);

        return newGameId;
    }

    modifier isOwner() {
        require(msg.sender == owner);
        _;
    }

   function setTTGCoin (address _ttgCoin) onlyOwner() public {
     ttgCoin = ITTGCoin(_ttgCoin);
   }

    function lotteryAward(uint256 _gameid) payable public {
        Game storage gm = games[_gameid];

        require(gm.state==Status.PLAYING);
        require(msg.value > 0);

        gm.ethBalance = gm.ethBalance.add(msg.value);
        totalETHInBet = totalETHInBet.add(msg.value);
        
    }

function playttg(uint256 _gameid, uint32 _count) public returns (uint256[] _tokenIds) {  

      Game storage gm = games[_gameid];

        uint realcount = 0;
        uint remainCount = 0;
        uint user_balance = 0;
        uint buy_balance = 0;
        uint256 tokenId = 0 ;

        require(gm.gtype == 2);

        //get the user ttg balance
        user_balance = ttgCoin.balanceOf(msg.sender);

        //ttg balance must large than the lottery_balance
        require(gm.state==Status.PLAYING);
        require(gm.limit > 0);
        require(user_balance >= gm.limit);
        require(_count > 0);

        realcount = user_balance / gm.limit;

        if(realcount > _count)
        realcount = _count;

       remainCount =  gm.max_cnts - gm.counts;
       if(realcount > remainCount)
        realcount = remainCount;   
        
        //realcount = _count;
        buy_balance = gm.limit.mul(realcount);
        totalTTGInBet = totalTTGInBet.add(buy_balance);

        uint256[] memory items = new uint256[](realcount);

        ttgCoin.recycle(msg.sender, buy_balance);
        //ttgCoin.recycle(user, buy_balance);
  
        gm.sum = gm.sum.add(buy_balance);
        gm.counts = gm.counts+uint32(realcount);

        for (uint256 i = 0; i < realcount; i++) {
            //add a new better
            tokenId = gm.bettings.push(msg.sender) - 1 ;
            items[i] = tokenId;  
        }

        //End lottrey game  when sum is large tha jackpot & counts is large than max countes
        if (gm.sum >= gm.jackpot || gm.counts >=  gm.max_cnts) {
            
            uint32  luckId= 0;

            //close lottery 
            gm.state = Status.PLAYED;
            
            // block offset hardcoded to 10
            gm.result_hash = block.blockhash(block.number);

            //checking if result_hash[0] less than 10, the result is error
            uint32 result= uint32(gm.result_hash[0]|(gm.result_hash[1]<<8)|(gm.result_hash[2]<<16)|(gm.result_hash[3]<<24));///need to check        
            luckId = lottery(_gameid, result);
            ttgCoin.transferFrom(this, gm.bettings[luckId], gm.sum);

            emit Open(_gameid, gm.state);
             
        }    

        emit Play(msg.sender, tokenId, now);
        return items;
    }

    function play(uint256 _gameid, uint32 _count) public returns (uint256[] _tokenIds) {    
        Game storage gm = games[_gameid];

        uint realcount = 0;
        uint remainCount = 0;
        uint user_balance = 0;
        uint buy_balance = 0;
        uint256 tokenId = 0 ;

        require(gm.gtype == 1);

        //get the user ttg balance
        user_balance = ttgCoin.balanceOf(msg.sender);

        // ttg balance must large than the lottery_balance
        require(gm.state==Status.PLAYING);
        require(gm.limit > 0);
        require(user_balance >= gm.limit);
        require(_count > 0);

        realcount = user_balance / gm.limit;

        if(realcount > _count)
        realcount = _count;

       remainCount =  gm.max_cnts - gm.counts;
       if(realcount > remainCount)
        realcount = remainCount;   
        
        //realcount = _count;
        buy_balance = gm.limit.mul(realcount);

        uint256[] memory items = new uint256[](realcount);

        ttgCoin.recycle(msg.sender, buy_balance);
        //ttgCoin.recycle(user, buy_balance);
  
        gm.sum = gm.sum.add(buy_balance);
        gm.counts = gm.counts+uint32(realcount);

        for (uint256 i = 0; i < realcount; i++) {
            //add a new better
            tokenId = gm.bettings.push(msg.sender) - 1 ;
            items[i] = tokenId;  
        }

        //End lottrey game  when sum is large tha jackpot & counts is large than max countes
        if (gm.sum >= gm.jackpot || gm.counts >=  gm.max_cnts) {

            //close lottery 
            gm.state = Status.PLAYED;

            // block offset hardcoded to 10
            gm.result_block = block.number + 10;

            emit Open(_gameid, gm.state);
            
        }    

        emit Play(msg.sender, tokenId, now);
        return items;
    }


    function lottery(uint256 _gameid, uint256 _result_hash) public onlyAdmins returns (uint32 _result){
 
        uint32 luckId = 0;
        uint32 result = 0;
        Game storage gm = games[_gameid];

        require(gm.state==Status.PLAYED);
        require(gm.sum >= 0);

        result= uint32(_result_hash);

        luckId = result%(gm.counts);

        gm.lucky = gm.bettings[luckId];
        gm.luckyId = luckId;
        gm.state=Status.TERMINATED;

        //Tell the world
        emit Result( gm.gameId, gm.lucky, luckId);
    }
    
    function robotLottery(uint256 _gameid) public onlyAdmins returns (uint32 _result){

        Game storage gm = games[_gameid];
        uint256  result = 0;
        require(gm.state==Status.PLAYED);
        require(gm.sum >= 0);  
        require(
            block.number >= gm.result_block &&
            block.number <= gm.result_block + 256 &&
            block.blockhash(gm.result_block) != gm.result_hash
            );

         gm.result_hash = block.blockhash(gm.result_block);
         //checking if result_hash[0] less than 10, the result is error
         result= uint32(gm.result_hash[0]|(gm.result_hash[1]<<8)|(gm.result_hash[2]<<16)|(gm.result_hash[3]<<24));///need to check        
         return lottery(_gameid, result);

    }

    function getBuyCount(uint256 _gameid) public view returns (uint32 counts) {

        Game storage gm = games[_gameid];
        return  gm.counts;
    }

    function getGameType(uint256 _gameid) public view returns (uint32 gtype) {

        Game storage gm = games[_gameid];
        return  gm.gtype;
    }

    function getLuckyToken(uint256 _gameid) public view returns (uint32 _luckId) {

        Game storage gm = games[_gameid];
        require(gm.state==Status.TERMINATED);
        return  gm.luckyId;
    }

    function getLuckyMan(uint256 _gameid) public  view returns (address _luck) {

        Game storage gm = games[_gameid];

        require(gm.state==Status.TERMINATED);

        return  gm.lucky;
    }

    function luckyBalanceOf(uint256 _gameid) public view returns (uint256 _balance) {
        Game storage gm = games[_gameid];
        require(gm.state!=Status.INIT);
        return gm.ethBalance;
    }

    function getGameByID(uint256 _gameid) public view returns(
         uint256 gameId,

         uint256  jackpot,
         address  lucky,//lucky man         
         uint32  luckyId,
         uint  limit,
         uint  sum,
         uint32  counts,
         uint32  max_cnts,

        uint ethBalance,//ETH award    
        Status state,
        uint32 gtype
    ){
        Game storage gm = games[_gameid];
        gameId = _gameid;
        jackpot = gm.jackpot;
        lucky = gm.lucky;
        luckyId = gm.luckyId;
        limit = gm.limit;
        sum = gm.sum;
        counts = gm.counts;
        max_cnts = gm.max_cnts;
        ethBalance = gm.ethBalance;
        state = gm.state;
        gtype = gm.gtype;
    }

    function getTicketsByAddr(uint256 _gameid, address _user) public view returns(uint32[] tickets){
        
        Game storage gm = games[_gameid];
        /*uint32 tickIdBegin = 0;
        uint32 tickIdNumber = 0;
        string memory tickets = new string(100);
        string memory strNum = new string(2);  
        string memory strBegin = new string(2);
        string memory strcomma =',';

        require(msg.sender != 0);
        require(gm.counts >= 0);

        for(uint256 i = 0 ; i < gm.counts; i++){
          
           if(gm.bettings[i]==_user){
              tickIdBegin = i;
              tickIdNumber++;
           }
           else{//is not the user 
               if(tickIdNumber > 0){      

                   tickets = tickets.toSlice().concat(strNum.toSlice());   
                   tickets = tickets.toSlice().concat(strBegin.toSlice());   
                   tickets = tickets.toSlice().concat(strcomma.toSlice());  
                  //sprintf(tickets, "%2x%2x,",tickIdNumber,tickIdBegin);
                  tickIdNumber = 0;
                  tickIdBegin = 0;
               }
           }
        }

        if(tickIdNumber > 0){   
            tickets = tickets.toSlice().concat(strNum.toSlice());   
            tickets = tickets.toSlice().concat(strBegin.toSlice());          
            //sprintf(tickets, "%2x%2x,",tickIdNumber,tickIdBegin);                 
            tickIdNumber = 0;
            tickIdBegin = 0;
        }*/
        //uint256[] tickets;
        uint32 count = 0;
        for(uint32 i = 0 ; i < gm.counts; i++){
          
           if(gm.bettings[i]==_user){              
              count++;
           }        
        }
        uint32 index = 0;
        uint32[] memory items = new uint32[](count);
        for(i = 0 ; i < gm.counts; i++){
          
           if(gm.bettings[i]==_user){              
               items[index] = i;
               index++;               
           }        
        }
         return items;
     }

    function getAllGamesInfo() public view returns(uint256 gamesCount, uint totalETH, uint totalTTG ){
        gamesCount = games.length;
        totalETH = totalETHInBet;
        totalTTG = totalTTGInBet;
    }

    function takeLuckyHome(uint256 _gameid) public {
        
        Game storage gm = games[_gameid];
     
        require(gm.state==Status.TERMINATED);
        require(gm.sum >= 0);
        require(msg.sender != 0);
        require(msg.sender == gm.lucky);

        if (msg.sender.send(gm.ethBalance)) {
           emit TakeLuckyHome(msg.sender, gm.ethBalance);
        }
    }

  function withdrawAll () onlyOwner() public {
    owner.transfer(this.balance);
  }

  function destruct() public isOwner {
        emit Destroy();
        selfdestruct(owner);
    }
}
