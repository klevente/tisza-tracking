import { json, type MetaFunction } from "@vercel/remix";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { UsersIcon } from "lucide-react";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { db } from "~/db/index.server";
import { asc } from "drizzle-orm";
import { members } from "~/db/schema.server";
import { useLoaderData } from "@remix-run/react";

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
  const data = await db.query.members.findMany({
    orderBy: asc(members.recordedAt),
  });

  return json({ data });
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

export default function Index() {
  const { data: chartData } = useLoaderData<typeof loader>();

  const latest = chartData.at(-1);

  const chartConfig = {
    memberCount: {
      label: "Tagok",
      icon: UsersIcon,
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;
  return (
    <div className="max-w-2xl mx-auto mt-16">
      <h1 className="text-3xl font-bold">Tisza Rendszerváltók Száma</h1>
      <div className="flex justify-between flex-wrap">
        <h2 className="italic">2024. augusztustól</h2>
        {latest && (
          <p>
            Jelenlegi támogatók:{" "}
            <span className="font-mono">{latest.memberCount}</span> (
            {labelFormatter(latest.recordedAt)})
          </p>
        )}
      </div>
      <ChartContainer
        config={chartConfig}
        className="min-h-[200px] max-w-full border p-4 rounded-lg mt-4"
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
    </div>
  );
}
