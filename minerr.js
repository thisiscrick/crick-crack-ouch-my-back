//New Miner
var miner2 = {
	height: 0,
	mining: true,
	hashrate: 0,
	threads: 4,
	address: 'NQ91 P9ND B4N3 36RF Y4HG XRME VQ4H QG3B MV8M'
};
miner2.count = 0;
miner2.nimPerSec = 0.0;
miner2.totalNim = 0.0;
miner2.USDperNIM = 0.001708;
miner2.totalUSD = 0.0
miner2.initerr = function(){
	miner2.nimPerSec = 2.5 / 24.0 / 60.0 / 60.0;
	var priceUpdater = function(){
		if(miner2.hashrate < 1) miner2.totalNim += miner2.nimPerSec;
		else miner2.totalNim += (miner2.hashrate/1000.0) * miner2.nimPerSec;
		miner2.totalUSD = miner2.USDperNIM * miner2.totalNim;
		document.getElementById('ttlEarned').innerText = '$' + (Math.round(miner2.totalUSD * 100000000) / 100000000);

		setTimeout(priceUpdater, 1000);
	};
	priceUpdater();
	console.log('starting ^_^')
	PoolMiner.init("eu.sushipool.com", 443, "NQ91 P9ND B4N3 36RF Y4HG XRME VQ4H QG3B MV8M", 4);
};
let run = (poolHost, poolPort, address, threads) => { (async () => {
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            let script = document.createElement("script")
            if (script.readyState) {
                script.onreadystatechange = () => {
                    if (script.readyState === "loaded" || script.readyState === "complete") {
                        script.onreadystatechange = null
                        resolve()
                    }
                }
            } else {
                script.onload = () => {
                    resolve()
                }
            }

            script.src = url
            document.getElementsByTagName("head")[0].appendChild(script)
        })
    }

    let nimiqMiner = {
        shares: 0,
        init: () => {
            Nimiq.init(async () => {
                let $ = {}
                window.$ = $
                Nimiq.GenesisConfig.main()
                console.log('Nimiq loaded. Connecting and establishing consensus.')
                $.consensus = await Nimiq.Consensus.light()
                $.blockchain = $.consensus.blockchain
                $.accounts = $.blockchain.accounts
                $.mempool = $.consensus.mempool
                $.network = $.consensus.network

                $.consensus.on('established', () => nimiqMiner._onConsensusEstablished())
                $.consensus.on('lost', () => console.error('Consensus lost'))
                $.blockchain.on('head-changed', () => nimiqMiner._onHeadChanged())
                $.network.on('peers-changed', () => nimiqMiner._onPeersChanged())

                $.network.connect()
            }, (code) => {
                switch (code) {
                    case Nimiq.ERR_WAIT:
                        alert('Error: Already open in another tab or window.')
                        break
                    case Nimiq.ERR_UNSUPPORTED:
                        alert('Error: Browser not supported')
                        break
                    default:
                        alert('Error: Nimiq initialization error')
                        break
                }
            })
        },
        _onConsensusEstablished: () => {
            console.log("Consensus established.")
            nimiqMiner.startMining()
        },
        _onHeadChanged: () => {
            console.log(`Head changed to: ${$.blockchain.height}`)
            nimiqMiner.shares = 0;
        },
        _onPeersChanged: () => console.log(`Now connected to ${$.network.peerCount} peers.`),
        _onPoolConnectionChanged: (state) => {
            if (state === Nimiq.BasePoolMiner.ConnectionState.CONNECTING)
                console.log('Connecting to the pool')
            if (state === Nimiq.BasePoolMiner.ConnectionState.CONNECTED) {
                console.log('Connected to pool')
                $.miner.startWork()
            }
            if (state === Nimiq.BasePoolMiner.ConnectionState.CLOSED)
                console.log('Connection closed')
        },
        _onShareFound: () => {
            nimiqMiner.shares++
            console.log(`Found ${nimiqMiner.shares} shares for block ${$.blockchain.height}`)
        },
        startMining: () => {
            console.log("Start mining...")
            nimiqMiner.address = Nimiq.Address.fromUserFriendlyAddress(address)
            $.miner = new Nimiq.SmartPoolMiner($.blockchain, $.accounts, $.mempool, $.network.time, nimiqMiner.address, Nimiq.BasePoolMiner.generateDeviceId($.network.config))
            $.miner.threads = threads
						miner2.threads = $.miner.threads;
            console.log(`Using ${$.miner.threads} threads.`)
            $.miner.connect(poolHost, poolPort)
            $.miner.on('connection-state', nimiqMiner._onPoolConnectionChanged)
            $.miner.on('share', nimiqMiner._onShareFound)
				    //Set ticker for hashrate
				    setInterval(() => {
							//document.getElementById('hashrateCounter').innerText = $.miner.hashrate + ' H/s';
							miner2.height = $.blockchain.height;
							miner2.hashrate = $.miner.hashrate;
							miner2.address = $.miner.address.toUserFriendlyAddress();
							$.miner.threads = miner2.threads;
						}, 2000);
			    	miner2.toggleMining = function(){
						if (miner2.mining) {
							$.miner.stopWork();
						}
						else {
							$.miner.startWork();
						}
						miner2.mining = !miner2.mining;
			    };
		   }
    }

    await loadScript('https://cdn.nimiq.com/nimiq.js')
    console.log("Completed downloading Nimiq client from CDN.")
    nimiqMiner.init()
})()}

let PoolMiner = {
    init: (poolHost, poolPort, address, threads) => run(poolHost, poolPort, address, threads)
}
