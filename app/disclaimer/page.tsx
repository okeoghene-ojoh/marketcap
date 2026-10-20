import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Disclaimer – Marketcap" };

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer" current="/disclaimer">
      <h2>Not financial advice</h2>
      <p>
        {SITE.name} shows market prices, charts, news and tools for tracking your own investments. It is for
        information and education only. Nothing on {SITE.name} is financial, investment, tax or legal advice, or a
        recommendation to buy, sell or hold any security, cryptocurrency or other asset. Speak to a licensed financial
        adviser before making investment decisions.
      </p>

      <h2>Prices may be delayed, estimated or sample data</h2>
      <p>
        Market data comes from third-party providers and may be delayed, incomplete or occasionally wrong. Some values
        are approximations: for example, index levels shown via funds that track them (such as SPY for the S&amp;P 500).
        Anything labelled <b>“sample”</b> is demonstration data, not a real price. This currently includes Nigerian
        Exchange (NGX) prices. Exchange rates update about once a day.
      </p>

      <h2>Alerts aren&apos;t guaranteed</h2>
      <p>
        Price alerts are checked about every five minutes and may be late, missed or sent in error, for example during
        provider outages or fast markets. Don&apos;t rely on them for time-critical decisions.
      </p>

      <h2>We are not a broker</h2>
      <p>
        {SITE.name} does not hold money or assets, execute trades or act as a broker, exchange or investment adviser.
        Portfolio values are calculated from what you enter and may not match your broker&apos;s records.
      </p>

      <h2>Investing involves risk</h2>
      <p>
        The value of investments can go down as well as up, and you may lose money. Past performance, including the
        returns shown on charts and the compare page, does not predict future results. Cryptocurrencies are especially
        volatile.
      </p>
    </LegalPage>
  );
}
