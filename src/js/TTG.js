App = {
  web3Provider: null,
  contracts: {},
  sortMethod: 0,
  isFirstLoad: 1,
  syncSucceed: false,
  account: null,
  progressBar: null,
  vueContainer: null,
  ticketContainer:null,

  init: function() {
  // Grab the current date
  var currentDate = new Date();
  var onlineDate = new Date(1530316800*1000);
  var diff = onlineDate.getTime() / 1000 - currentDate.getTime() / 1000;
  var clock = $('.countdown-clock').FlipClock(diff ,{
    clockFace: 'DailyCounter',
    autoPlay: true,
    autoStart: true,
    countdown: true,      
    
    
    });

    var curTimeStamp = Math.floor(Date.now() / 1000);
    $.getJSON('../games.json?t='+curTimeStamp, function(data) {
      App.vueContainer = new Vue({
          el: '#gamesDetailContainer',
          data: {
              theRequest: new Object(),
              gameGroup: null,
              total: 0,
              gamesList: [],
              gamesDoneList: [],
              betDataList: [],
              totalWon: 0,
              moreGamesList: [],
              isCheckWinner: 0,              
              ticketsSold: 0,
              isCheckAmount: 0,    
              counts:0,
              max_cnts:10000,
             contractValueResult: 0,
             ticketsAmountToBuy: 1,
             //isWinner: false, // 判断是否赢局投注中,动态显示按钮内容
          },
          mounted: function() {
            data.forEach(element => {
              console.log('TTG games json', element);
              this.gameGroup = element;
              element.DeadlineTimeStr = new Date(element.DeadlineTime * 1000).toISOString();
              element.DeadlineTimeStr = element.DeadlineTimeStr.substring(0, 10) + ' ' + element.DeadlineTimeStr.substring(11, 19);                                          
            });
            
          },
          computed: {

          },
            methods: {
              checkAmount(number) {
                this.ticketsAmountToBuy = number;   
                console.log('this.ticketsAmountToBuy',this.ticketsAmountToBuy);            
                this.TicketsNumberHandle();
              },
            TicketsNumberHandle() {              
                console.log('TicketsNumberHandle entered');
                if (this.ticketsAmountToBuy == 1) {
                  this.isCheckAmount = 1
              } else if (this.ticketsAmountToBuy == 5) {
                  this.isCheckAmount = 2
              } else if (this.ticketsAmountToBuy == 10) {
                  this.isCheckAmount = 3
              } else if (this.ticketsAmountToBuy == 50) {
                  this.isCheckAmount = 4
              } else if (this.ticketsAmountToBuy == 100) {
                  this.isCheckAmount = 5
              } else {
                  this.isCheckAmount = 0
              }                        
            },
            TicketsUp() {
               this.ticketsAmountToBuy++;
                this.TicketsNumberHandle();
            },
            TicketsDown() {
                if (this.ticketsAmountToBuy <= 1) {
                    return
                }
               this.ticketsAmountToBuy--;
                this.TicketsNumberHandle();
            },
            buyTickets(){
              App.contracts.TTGCoin.deployed().then(function(instance) {
                ttgCoinInstance = instance;                 
                ttgCoinInstance.balanceOf(App.account).then(function(balanceOfTTG){
                  TTGbalance = Math.round(balanceOfTTG/10000000000000000)/100;
                  console.log('TTGbalance =', TTGbalance);

                 if (TTGbalance < App.vueContainer.gameGroup.limit*App.vueContainer.ticketsAmountToBuy){
                   alert('Not enough TTG, please check your wallet');
                   return;
                 }else{
                   App.contracts.TTGLottery.deployed().then(function(instance){
                     ttgLotteryInstance = instance;
                     return ttgLotteryInstance.play(App.vueContainer.gameGroup.gameID, App.vueContainer.ticketsAmountToBuy);
                   }).then(function(result) {
                    console.log('buyToken succeed');
                    alert("Congratulations! You have bought a ticket!");
                    return App.markAdopted(); 
                }).catch(function(err) {
                    alert("Oops, we have an error here", error);
                    console.log(err.message);
                    return App.markAdopted(); 
                });
                 }
                });
             
            }); 
            }
            }
            
        },
      );
    });

                        // progressbar.js@1.0.0 version is used
            // Docs: http://progressbarjs.readthedocs.org/en/1.0.0/

            App.progressBar = new ProgressBar.Line(progressBar, {
              strokeWidth: 4,
              easing: 'easeInOut',
              duration: 1400,
              color: '#FF0000',
              trailColor: '#0FF',
              trailWidth: 1,
              svgStyle: {width: '100%', height: '100%'},
              text: {
                style: {
                  // Text color.
                  // Default: same as stroke color (options.color)
                  color: '#F00',
                  position: 'absolute',
                  right: '0',
                  top: '30px',
                  padding: 0,
                  margin: 0,
                  transform: null
                },
                autoStyleContainer: false
              },
              from: {color: '#FFEA82'},
              to: {color: '#FF0000'},
              step: (state, bar) => {
                bar.setText(Math.round(bar.value() * 100) + ' %');
              }              
            });            
            

            

    return App.initWeb3();
  },

  initWeb3: function() {
    // Is there an injected web3 instance?
  if (typeof web3 !== 'undefined') {
    App.web3Provider = web3.currentProvider;
  } else {
    // If no injected web3 instance is detected, fall back to Ganache
    App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
  }
  web3 = new Web3(App.web3Provider);
  var defaultAccount = web3.eth.defaultAccount;
  console.log('defaultAccount =',defaultAccount); 
  App.account = defaultAccount;
  var account = $('#account');
  var display_owner = defaultAccount.toString().substring(2,42);
        display_owner = display_owner.toUpperCase(display_owner);
        display_owner = "0x"+display_owner;
  account.append(display_owner);
  var balance = $('#balance');
  var real_balance =0.0;
  if(!defaultAccount || defaultAccount==null){
    window.location.replace("../dapp/install_tutorial.html");
  }
  if(defaultAccount) real_balance = web3.eth.getBalance(defaultAccount, function(error, result){
      if(!error){
          real_balance = Math.round(result/100000000000000)/10000;
          
          console.log(JSON.stringify(result));
          balance.append(real_balance);
      }
      else
          console.error(error);
  });

  $.getJSON('../TTGCoin.json', function(data){
    var TTGCoinArtifact = data;
    App.contracts.TTGCoin = TruffleContract(TTGCoinArtifact);
    App.contracts.TTGCoin.setProvider(App.web3Provider);
    App.contracts.TTGCoin.deployed().then(function(instance){
      var ttgCoinInstance = instance;
      return ttgCoinInstance.balanceOf(defaultAccount);
    }).then(function(result){
      var TTGbalance = $('#TTGbalance');
      if(result){
      tgc_balance = Math.round(result/10000000000000000)/100;
      }else{
        tgc_balance = 0;
      }       
      TTGbalance.append(tgc_balance);
    });        
  });

  $.getJSON('../TTGLottery.json', function(data){
    var LotteryArtifact = data;
    App.contracts.TTGLottery = TruffleContract(LotteryArtifact);
    App.contracts.TTGLottery.setProvider(App.web3Provider);
    App.contracts.TTGLottery.deployed().then(function(instance){
      var ttgLotteryInstance = instance;
      return ttgLotteryInstance.getGameByID(App.vueContainer.gameGroup.gameID);
    }).then(function(result){
      console.log('result',result);
      App.vueContainer.gameGroup.max_cnts = parseInt(result[7].toString());
      App.vueContainer.gameGroup.count = parseInt(result[6].toString());
      App.vueContainer.gameGroup.limit =  Math.round(result[4].toString()/10000000000000000)/100;
      App.vueContainer.contractValueResult = Math.round(result[8].toString()/10000000000000000)/100;
      App.vueContainer.gameGroup.ethBalance = App.vueContainer.contractValueResult; 
      salePercent = parseFloat(App.vueContainer.gameGroup.count/App.vueContainer.gameGroup.max_cnts).toFixed(4);
      App.progressBar.animate(salePercent);
      App.ticketsContainer = new Vue({
        el: '#userTickets',
        data: {
          ticketContainerList:[]
        },
        mounted: function() {
          // this.tickets.user = App.account;
          let that = this;
          if(App.account){
          App.contracts.TTGLottery.deployed().then(function(instance){
            var ttgLotteryInstance = instance;
            return ttgLotteryInstance.getTicketsByAddr(App.vueContainer.gameGroup.gameID, App.account);
          }).then(function(items){
            if(!items) return;
            break_count = 0;
            
            temp_start = parseInt(items[0]);
            
            temp_end = parseInt(items[0]);
            for(index = 0; index< (items.length-1); index++){
              // info.start =items[index];
              // for(index_inner = index; index_inner < items.length; index_inner++){              
                if((items[index+1]-items[index])>1){
                  console.log('items[index]',parseInt(items[index]));
                  
                  temp_end = parseInt(items[index]);
                  
                  
                  App.ticketsContainer.ticketContainerList.push({
                    user:App.account,
                    start: temp_start,
                    end: temp_end,
                    num:temp_end-temp_start+1
                  });
                  console.log('that.ticketContainerList ',App.ticketsContainer.ticketContainerList);
                  
                  temp_start = parseInt(items[index+1]);
                  break_count++;
                  }
              // }
            }
            if(break_count){
            
            temp_end = parseInt(items[items.length-1]);
            
            App.ticketsContainer.ticketContainerList.push({
              user:App.account,
              start: temp_start,
              end: temp_end,
              num:temp_end-temp_start+1
            });
            }
          });
          }
        },
        computed: {
          ticketList: function() {
              let list = []
              this.ticketContainerList.forEach(element => {
                  console.log('this.ticketContainList entered!', element.start, element.end, element.num);

                  list.push(element)
              })
              return list;                        
          },
      },

      });
    });
  });

    return App.initContract();
  },

  initContract: function() {
    return App.bindEvents();
  },

  transfer: function(){
    App.contracts.TTGCoin.deployed().then(function(instance){
      var ttgCoinInstance = instance;
      return ttgCoinInstance.crowdDistribution({value: 10000000000000000});
    });
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.PriceAscending', App.PriceAscending);    
    $(document).on('click', '.PriceDescending', App.PriceDescending); 
  },


  markAdopted: function(adopters, account) {
    $.getJSON('../TTGLottery.json', function(data){
      var LotteryArtifact = data;
      App.contracts.TTGLottery = TruffleContract(LotteryArtifact);
      App.contracts.TTGLottery.setProvider(App.web3Provider);
      App.contracts.TTGLottery.deployed().then(function(instance){
        var ttgLotteryInstance = instance;
        return ttgLotteryInstance.getGameByID(App.vueContainer.gameGroup.gameID);
      }).then(function(result){
        console.log('result',result);
        App.vueContainer.gameGroup.max_cnts = parseInt(result[7].toString());
        App.vueContainer.gameGroup.count = parseInt(result[6].toString());
        App.vueContainer.gameGroup.limit =  Math.round(result[4].toString()/10000000000000000)/100;
        App.vueContainer.contractValueResult = Math.round(result[8].toString()/10000000000000000)/100;
        App.vueContainer.gameGroup.ethBalance = App.vueContainer.contractValueResult; 
        salePercent = parseFloat(App.vueContainer.gameGroup.count/App.vueContainer.gameGroup.max_cnts).toFixed(4);
        App.progressBar.animate(salePercent);
      });
    });
  },


};

$(function() {
  $(window).load(function() {    
    //var sortMethod = 0;
    App.init();
  });
});
