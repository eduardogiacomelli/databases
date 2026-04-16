"use client";

import { useSchemaBuilder } from "./schema-builder-store";
import { ColumnForm } from "./column-form";
import { BlockLayoutPreview } from "./block-layout-preview";
import { CalculationsPanel } from "./calculations-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DatabaseIcon,
  RotateCcwIcon,
  TableIcon,
  CalculatorIcon,
} from "lucide-react";

export function SchemaBuilder() {
  const tableName = useSchemaBuilder((s) => s.tableName);
  const setTableName = useSchemaBuilder((s) => s.setTableName);
  const reset = useSchemaBuilder((s) => s.reset);

  return (
    <div className="space-y-4">
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DatabaseIcon className="size-5" />
            </div>
            <div>
              <CardTitle className="font-heading">Schema Builder</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Define columns, pick a block size, watch the math happen.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={reset}
            className="gap-1.5"
          >
            <RotateCcwIcon className="size-3.5" />
            Reset
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Table name
          </Label>
          <Input
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            className="font-mono"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <TableIcon className="size-4 text-primary" />
              Schema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ColumnForm />
          </CardContent>
        </Card>

        <Card className="border-border/50 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-base">
              <CalculatorIcon className="size-4 text-primary" />
              Metrics & layout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="metrics">
              <TabsList className="mb-4">
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="layout">Block layout</TabsTrigger>
              </TabsList>
              <TabsContent value="metrics" className="mt-0">
                <CalculationsPanel />
              </TabsContent>
              <TabsContent value="layout" className="mt-0">
                <BlockLayoutPreview />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
