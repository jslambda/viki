
const userAgent = "";
const util = require('util');
const axios = require('axios');

class WikiEntry {
    article: string;
    timestamp: Date
    views: number;

    constructor(article, numberOfViews, timestamp, project?:string, granularity?:string, access?:string, agent?:string) {
        this.article = article;
        this.views = numberOfViews;
        this.timestamp = timestamp;
    }

    get(i: number):string|number|Date {
        switch (i) {
            case 0:
                return this.article;
            case 1:
                return this.timestamp;
            case 2:
                return this.views;
        }
    }
}

function translateDateToString(d: Date): string {
    const incMonth = d.getMonth() + 1;
    const incDay = d.getDay() + 1;
    const month = incMonth < 10 ? "0" + incMonth : incMonth.toString();
    const day = incDay < 10 ? "0" + incDay : incDay.toString();
    return `${d.getFullYear()}${month}${day}`;
}

function translateStringToDate(d: string): Date {
    if (d.length != 10) {
        return null;
    }
    const result = new Date();
    const year = parseInt(d.substring(0, 4));
    if (isNaN(year)) {
        return null;
    }
    const month = parseInt(d.substring(4, 6));
    if (isNaN(month)) {
        return null;
    }

    result.setFullYear(year);
    result.setMonth(month);
    return result;

}

function getReqPromise(getUrl) {
    // TODO: caching
    const headers = {};
    if (userAgent) {
        headers['User-Agent'] = userAgent;
    }
    return axios.get(getUrl);
}

function translateReqPromise(promise) {
    // response.data
    // {
    //     items: [
    //       {
    //         project: 'en.wikipedia',
    //         article: 'apple',
    //         granularity: 'monthly',
    //         timestamp: '2020020100',
    //         access: 'all-access',
    //         agent: 'all-agents',
    //         views: 47
    //       }, ...]}

    return promise.then(response => {
        return response.data.items.map(item => new WikiEntry(item.article, item.views, translateStringToDate(item.timestamp)));
    });
}

class Wiki {
    articles: Set<string> = new Set();
    startDate: Date;
    endDate: Date;

    constructor() { }

    filterArticles(...articles: string[]) {
        for (let article of articles) {
            this.articles.add(article);
        }
        return this;
    }

    filterDates(start: Date, end: Date) {
        this.startDate = start;
        this.endDate = end;
        return this;
    }

    sort() {
        return this;
    }

    // Returns one promise per request
    getEntryPromises() {
        const reqPat = "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article" +
            "/en.wikipedia.org/all-access/all-agents/%s/monthly/%s/%s";
        
        if (this.articles == null) {
            return;
        }
        if (this.endDate == null) {
            this.endDate = new Date()
        }
        if (this.startDate == null) {
            this.startDate = new Date(this.endDate);
            this.startDate.setFullYear(this.endDate.getFullYear() - 1);
        }
        const requests = Array.from(this.articles).map(a => util.format(reqPat, a, translateDateToString(this.startDate), translateDateToString(this.endDate)));
        return requests.map(r => getReqPromise(r)).map(prom => translateReqPromise(prom));
        
    }

    async evaluate() {
        const result = await Promise.all(this.getEntryPromises());
        const resultFlat = result.flat();
        // Trick to fix repl
        if (resultFlat["merge"] == undefined) {
            return Array.from(resultFlat);
        }
        return resultFlat;
    }

}


export {Wiki, WikiEntry};
