import { formatLabels } from './prototype-backend';
export function outletFormValues(o: any) {
  return {name:o.name,url:o.url,type:o.type,geography:o.geography,theme:o.theme,logoFileId:o.details.logoFileId,
    dailyReach:o.details.dailyAudience,subscribers:o.details.subscribers,metrikaUrl:o.details.metrikaUrl,mediologyRank:o.details.medialogiaRank,
    formats:o.formats,formatPrices:o.formatPrices,
    formatDeadlines:Object.fromEntries(Object.keys(o.prices).map(f=>[formatLabels[f],`${o.details.publicationDaysByFormat?.[f]||o.details.publicationDays} ${o.details.publicationDaysByFormat?.[f]===1?'день':'дня'}`])),
    goals:o.goals,aggregators:o.aggregators,responseDeadline:o.details.responseHours===24?'1 рабочий день':`${o.details.responseHours||2} часа`,storage:o.details.storageIndefinite?'Бессрочно':'2 года',
    seasonalOfferEnabled:o.discount_bps>0||o.coefficient_bps!==10000||Boolean(o.season_start),discount:o.discount_bps/100,coefficient:o.coefficient_bps/10000,seasonStart:o.season_start?String(o.season_start).slice(0,10):'',seasonEnd:o.discount_until?String(o.discount_until).slice(0,10):'',requirements:o.details.requirements};
}
