'use strict'

import { Client } from "@mathieuc/tradingview"
import { Apis } from "@traptitech/traq"

const api = new Apis({ accessToken: process.env.HUBOT_TRAQ_ACCESS_TOKEN });

export default async robot => {
  robot.hear(/watch (.+)$/i, async res => {
    const here = res.message.message.channelId;
    const send_to = (await api.postMessage(here, { content: ':loading:' })).data.id;

    const symbol = res.match[1].trim();
    const client = new Client();
    const chart = new client.Session.Chart();
    chart.setMarket(symbol);

    let description;
    let price_fixed;
    let currency_id;
    chart.onUpdate(() => {
      if (!chart.periods[0]) return;
      description = chart.infos.description;
      price_fixed = chart.periods[0].close.toFixed(Math.log10(chart.infos.pricescale));
      currency_id = chart.infos.currency_id;
      api.editMessage(send_to, { content: `[${description}] ${price_fixed} ${currency_id} :eyes_rotate:` })
    });

    chart.onError((...err) => {
      chart.delete();
      client.end();
      if (err[1] === 'invalid symbol') {
        api.editMessage(send_to, { content: `有効なシンボルを指定してください：\`https://www.tradingview.com/symbols/${symbol}/\` not found` });
      } else {
        api.editMessage(send_to, { content: `予期せぬエラーが発生しました：\`${err}\` @hayatroid`, embed: true });
      }
    });

    setTimeout(() => {
      chart.delete();
      client.end();
      if (description && price_fixed && currency_id) {
        api.editMessage(send_to, { content: `[${description}] ${price_fixed} ${currency_id} :eyes_closed:` })
      } else {
        api.editMessage(send_to, { content: ':eyes_closed:' })
      }
    }, 30000);
  })
}
