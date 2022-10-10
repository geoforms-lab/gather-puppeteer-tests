const puppeteer = require('puppeteer');
const mkdir=require('fs').mkdir;


const sites=require('./sites.json');
const sequence=(list, fn)=>{
	if(list.length>0){
		return fn(list.shift()).then(()=>{
			sequence(list, fn);
		});
	}
}

sequence(sites,
	async (site) => {
		const browser = await puppeteer.launch({
			devtools: true
		});




		const pages = await browser.pages();
		const page=pages[0];


		await page.setViewport({
		    width: 1200,
		    height: 1000
		});




		await page.goto(
			site.url, {
				waitUntil: 'networkidle2',
				timeout: 0
			}
		);

		page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));


		await page.evaluate((name, pwd) => {

		    document.querySelector('[name="username"]').value=name;
		    document.querySelector('[name="password"]').value=pwd;
		    document.querySelector('.btn.submit').click();

		}, site.username, site.password);



		await page.waitForNavigation({
			waitUntil: 'networkidle2',
			timeout: 0
		});

		console.log('Get menu items');


		await page.waitForSelector('[data-view="leftPanel"] [data-identifier="navigation-menu"]');

		let menuBtns= await page.evaluate((name, pwd) => {

			console.log('Get menu btns');
		    let btns = Array.prototype.slice.call(document.querySelectorAll('[data-view="leftPanel"] [data-identifier="navigation-menu"] li'));
		  
		    return btns;

		}, site.username, site.password);

		console.log('Got '+menuBtns.length+' buttons');

		const sequence = async (i, max, fn) => {

			if(i<max){
				await fn(i);
				return await sequence(i+1, max, fn);	
			}

			return Promise.resolve(true);

		};



		await sequence(0, 37, async (i)=>{

			console.log('click menu btn: '+i);
			let className=await page.evaluate((i)=>{
				
				let btn = Array.prototype.slice.call(document.querySelectorAll('[data-view="leftPanel"] [data-identifier="navigation-menu"] li'))[i];
				console.log(i+': '+btn);
				btn.click();

				return btn.className;

			}, i);

			
			await page.waitForTimeout(1500);


			let name=className.split(' ').join('.');
			let siteStr='./'+site.url.split('://').pop().split('/').join('');

			await mkdir(siteStr, { recursive: true }, (err) => {
				  if (err) throw err;
			});

			await page.screenshot({
				'path': siteStr+'/section_' + name+".png",
				//'clip': box,
				fullPage:true
			});


		});



	});