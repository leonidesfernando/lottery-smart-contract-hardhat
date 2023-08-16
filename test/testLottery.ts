import { ethers } from 'hardhat';
import { expect } from "chai";
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';


describe("Lottery Tests", function () {
    let accounts:HardhatEthersSigner[];
    let admin:HardhatEthersSigner;
    let player1:HardhatEthersSigner;
    let player2:HardhatEthersSigner;
    let player3:HardhatEthersSigner;

    let lottery:any;

    describe('Using the same deployment contract',() => {
        before(async () =>{
            await loadAccoutnsAndDeployLottery()
            await setUpAdminAndPlayers(accounts)
        });
    
        it("Check correct the admin defined", async function () {
            await Promise.all([
                defineAdminAndPlayers(admin)
            ]);
            const expectedAdmin = await lottery.getAdmin();
            expect(expectedAdmin).to.be.equals(admin.address);
        });
    
        it('Check an invalid admin defined', async () => {
            await Promise.all([
                defineAdminAndPlayers(player3)
            ]);
            const expectedAdmin = await lottery.getAdmin();
            expect(expectedAdmin).to.not.be.equal(admin.address);
        });
    
        it('The admin cannot participate as a user in the lottery', async function () {
            await Promise.all([
                defineAdminAndPlayers(admin)
            ]);
    
            const array:any[] = [admin.address, player1.address];
            await expect(lottery.bets(array))
                .to.be.revertedWith("The administrator cannot participate as a user in the lottery");
        });
    
        it('The minimum of 3 users is required to participate in the lottery', async function () {
            await Promise.all([
                defineAdminAndPlayers(admin),
                lottery.bets([player1.address,player2.address])
            ]);
            
            await expect(lottery.pickWinner())
                .to.be.revertedWith('A minimum of 3 users is required to participate in the lottery.');
        });
    
        it('Enough number of required users to participate in the lottery', async function () {
            await defineAdminAndPlayers(admin);
            await lottery.bets([player1.address, player2.address, player3.address]);
            await lottery.pickWinner();
            const {price, roundNumber, dateTime, owner} = await lottery.getLastWinner();
            expect(price).to.be.not.null
            expect(roundNumber).to.be.not.null
            expect(dateTime).to.be.not.null
            expect(owner).to.be.not.null
        });
    });

    describe('Requires a new contract deployment for each test',() => {
        
        it('It\'s not possible to ask for the winner before at least one drawing',async () => {

            await Promise.all([
                loadAccoutnsAndDeployLottery(),
                setUpAdminAndPlayers(accounts),
                defineAdminAndPlayers(admin),
                lottery.bets([player1.address,player2.address, player3.address])
            ]);
            
            await expect(lottery.getLastWinner())
                .to.be.rejectedWith('At least one draw must be held to have a winner');
        });
    
    });


    //Ordinary functions
    async function defineAdminAndPlayers(myAdmin:HardhatEthersSigner) {
        await lottery.defineAdmin(myAdmin.address)
    }
    async function loadAccoutnsAndDeployLottery() {
        accounts = await ethers.getSigners();
        expect(accounts).to.not.be.empty
        const Lottery = await ethers.getContractFactory("Lottery");
        lottery = await Lottery.deploy();
    }
    async function setUpAdminAndPlayers(accounts: HardhatEthersSigner[]){
        admin = accounts[0];
        player1 = accounts[1];
        player2 = accounts[2];
        player3 = accounts[3];
    }
});