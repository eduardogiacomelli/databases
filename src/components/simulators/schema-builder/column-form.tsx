"use client";

import { useState } from "react";
import { PG_TYPES } from "@/lib/pg-types";
import { useSchemaBuilder } from "./schema-builder-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon, XIcon } from "lucide-react";
import { PgTypeTag } from "@/components/content/pg-type-tag";
import { motion, AnimatePresence } from "framer-motion";

export function ColumnForm() {
  const columns = useSchemaBuilder((s) => s.columns);
  const addColumn = useSchemaBuilder((s) => s.addColumn);
  const removeColumn = useSchemaBuilder((s) => s.removeColumn);

  const [name, setName] = useState("");
  const [type, setType] = useState("INTEGER");

  const categories = Array.from(new Set(PG_TYPES.map((t) => t.category)));

  const handleAdd = () => {
    if (!name.trim()) return;
    addColumn(name.trim(), type);
    setName("");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          Columns ({columns.length})
        </Label>
        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {columns.map((col) => (
              <motion.div
                key={col.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="group flex items-center gap-2 rounded-md border border-border/40 bg-card/60 px-3 py-2 text-sm"
              >
                <span className="font-mono text-xs text-muted-foreground w-5">
                  {columns.indexOf(col) + 1}
                </span>
                <span className="font-medium flex-1 truncate">{col.name}</span>
                <PgTypeTag name={col.pgType} bytes={col.bytes} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeColumn(col.id)}
                  className="size-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <XIcon className="size-3" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-2 border-t border-border/40 pt-4">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          Add column
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="column_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="font-mono text-sm flex-1"
          />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectGroup key={cat}>
                  <SelectLabel className="capitalize">{cat}</SelectLabel>
                  {PG_TYPES.filter((t) => t.category === cat).map((t) => (
                    <SelectItem key={t.name} value={t.name}>
                      <span className="font-mono text-xs">{t.label}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} size="sm" className="gap-1.5">
            <PlusIcon className="size-3.5" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
