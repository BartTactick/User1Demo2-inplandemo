import { CatalystApp } from "zcatalyst-sdk-node/lib/catalyst-app";
import { COQLQueryAll, getItemByID } from "./crmConnector";

export default async function (app: CatalystApp, amountOfWindows: number) {
  const fetch = await getItemByID(app, "Defaults", "323558000023156713");
  const duration = Number(fetch[0].Waarde) * amountOfWindows;

  const durationCappedAt30Minutes = Math.ceil(duration / 30) * 30;

  return durationCappedAt30Minutes;
}
