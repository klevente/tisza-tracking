import { json, type MetaFunction } from "@vercel/remix";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { Minus, TrendingDown, TrendingUp, UsersIcon } from "lucide-react";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { db } from "~/db/index.server";
import { and, asc, gte, lte } from "drizzle-orm";
import { type Member, members } from "~/db/schema.server";
import { useLoaderData } from "@remix-run/react";
import { ThemeToggle } from "~/components/theme-toggle";
import type { FC } from "react";

function getCurrentMonthBounds() {
  const now = new Date();

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  return [startOfMonth, endOfMonth];
}

function calculateTrend(members: Member[]) {
  if (members.length < 2) {
    return undefined;
  }

  const { memberCount: membersAtStart } = members[0];
  const { memberCount: membersAtEnd } = members[members.length - 1];

  return ((membersAtEnd - membersAtStart) / membersAtStart) * 100;
}

export const meta: MetaFunction = () => {
  return [
    { title: "Tisza Rendszerváltók" },
    {
      name: "description",
      content: "Tisza rendszerváltó tagok számának alakulása",
    },
  ];
};

export async function loader() {
  const allDataPromise = db.query.members.findMany({
    orderBy: asc(members.recordedAt),
  });

  const [monthStart, monthEnd] = getCurrentMonthBounds();
  const thisMonthPromise = db.query.members.findMany({
    where: and(
      gte(members.recordedAt, monthStart),
      lte(members.recordedAt, monthEnd),
    ),
    orderBy: asc(members.recordedAt),
  });

  const [data, thisMonthsData] = await Promise.all([
    allDataPromise,
    thisMonthPromise,
  ]);

  const monthTrend = calculateTrend(thisMonthsData);

  return json({ data, monthTrend });
}

const axisFormat = new Intl.DateTimeFormat("hu-HU", {
  month: "2-digit",
  day: "numeric",
});

const labelFormat = new Intl.DateTimeFormat("hu-HU", {
  dateStyle: "short",
  timeStyle: "short",
});

const tickFormatter = (value: string) => axisFormat.format(new Date(value));
const labelFormatter = (value: string) => labelFormat.format(new Date(value));

type TrendDirection = "up" | "down" | "flat";

function determineTrendDirection(trend: number): TrendDirection {
  if (Math.abs(trend) < 0.01) {
    return "flat";
  }
  if (trend > 0) {
    return "up";
  }
  return "down";
}

const numberFormat = new Intl.NumberFormat("hu-HU", {
  style: "decimal",
  maximumFractionDigits: 2,
});

const Trend: FC<{ trend: number | undefined }> = ({ trend }) => {
  if (trend === undefined) {
    return null;
  }

  const direction = determineTrendDirection(trend);
  const trendText = numberFormat.format(Math.abs(trend));
  return (
    <div className="flex justify-center gap-2 leading-none mt-4">
      {direction === "up" ? (
        <>
          <TrendingUp className="h-4 w-4" />
          {trendText}%-al emelkedett ebben a hónapban.
        </>
      ) : direction === "down" ? (
        <>
          <TrendingDown className="h-4 w-4" />
          {trendText}%-al csökkent ebben a hónapban.
        </>
      ) : (
        <>
          <Minus className="h-4 w-4" />
          Nem változott ebben a hónapban.
        </>
      )}
    </div>
  );
};

export default function Index() {
  const { data: chartData, monthTrend } = useLoaderData<typeof loader>();

  const latest = chartData.at(-1);

  const chartConfig = {
    memberCount: {
      label: "Tagok",
      icon: UsersIcon,
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;
  return (
    <div className="max-w-2xl mx-auto mt-16 px-2 md:px-0">
      <header className="flex gap-2 justify-between">
        <h1 className="text-3xl font-bold">Tisza Rendszerváltók Száma</h1>
        <ThemeToggle />
      </header>
      <div className="flex justify-between flex-wrap">
        <h2 className="italic">2024. augusztustól</h2>
        {latest && (
          <p>
            Jelenlegi támogatók:{" "}
            <span className="font-medium">{latest.memberCount}</span> (
            {labelFormatter(latest.recordedAt)})
          </p>
        )}
      </div>
      <main className="border p-4 rounded-lg mt-4">
        <ChartContainer
          config={chartConfig}
          className="min-h-[200px] max-w-full"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="recordedAt"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={tickFormatter}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent labelFormatter={labelFormatter} />}
            />
            <Line
              dataKey="memberCount"
              type="natural"
              stroke="var(--color-memberCount)"
              strokeWidth={2}
              dot={true}
            />
            <ReferenceLine
              y={50_000}
              label="Cél"
              stroke="var(--color-memberCount)"
              strokeDasharray="3 3"
            />
          </LineChart>
        </ChartContainer>
        <Trend trend={monthTrend} />
        <div className="text-muted-foreground text-center">
          Az adatok minden nap délután frissülnek.
        </div>
      </main>
    </div>
  );
}
