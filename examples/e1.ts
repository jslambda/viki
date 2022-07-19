
import {Wiki} from "../wiki";

async function example() {
    const startDate = new Date(2020, 0);
    const endDate = new Date(2020, 11);
    const r1 = await (new Wiki().filterArticles("climate_change").filterDates(startDate, endDate).evaluate());
    const r2 = await (new Wiki().filterArticles("global_warming").filterDates(startDate, endDate).evaluate());
    return [r1, r2];
}

export {example}

