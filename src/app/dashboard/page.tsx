"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { navigation } from "@/lib/navigation";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DatabaseIcon,
  HardDriveIcon,
  TreePineIcon,
  ArrowRightIcon,
  ZapIcon,
  BookOpenIcon,
  LayersIcon,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto w-full space-y-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <DatabaseIcon className="size-6" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">
              Database Internals
            </h1>
            <p className="text-muted-foreground">
              File Structures, Indexing & Physical Database Design
            </p>
          </div>
        </div>

        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          A comprehensive, interactive guide to how relational databases store,
          organize, and access data on disk. Explore the physical foundations
          that make modern RDBMS like PostgreSQL efficient — from raw disk
          blocks to B+ tree indexes.
        </p>

        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary" className="gap-1.5">
            <BookOpenIcon className="size-3" />
            Elmasri & Navathe Ch. 16–17
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <LayersIcon className="size-3" />
            PostgreSQL Illustrated
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <ZapIcon className="size-3" />
            Interactive Simulators
          </Badge>
        </div>
      </motion.div>

      {/* Chapter Cards */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2"
      >
        {navigation.map((group, groupIdx) => {
          const Icon = groupIdx === 0 ? HardDriveIcon : TreePineIcon;
          const chapterNum = groupIdx === 0 ? "16" : "17";
          const simulatorCount = group.items.filter(
            (i) => i.isSimulator
          ).length;

          return (
            <motion.div key={group.url} variants={fadeInUp}>
              <Card className="group relative overflow-hidden border-border/50 transition-colors hover:border-border">
                <div className="absolute inset-0 bg-linear-to-br from-primary/3 to-transparent" />
                <CardHeader className="relative">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                        <Icon className="size-5 text-muted-foreground" />
                      </div>
                      <div>
                        <Badge variant="outline" className="mb-1 text-xs">
                          Chapter {chapterNum}
                        </Badge>
                        <CardTitle className="font-heading text-lg">
                          {group.title.split("—")[1]?.trim() ?? group.title}
                        </CardTitle>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.url}
                        href={item.url}
                        className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <span className="flex items-center gap-2">
                          {item.icon && (
                            <item.icon className="size-3.5 shrink-0" />
                          )}
                          {item.title}
                        </span>
                        {item.isSimulator ? (
                          <Badge
                            variant="secondary"
                            className="gap-0.5 px-1.5 py-0 text-[10px]"
                          >
                            <ZapIcon className="size-2.5" />
                            Sim
                          </Badge>
                        ) : (
                          <ArrowRightIcon className="size-3.5 opacity-0 transition-opacity group-hover:opacity-50" />
                        )}
                      </Link>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
                    <span>
                      {group.items.length} topics · {simulatorCount} simulators
                    </span>
                    <Link
                      href={group.url}
                      className="flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      Start chapter
                      <ArrowRightIcon className="size-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {[
          { label: "Content Pages", value: "20+", icon: BookOpenIcon },
          { label: "Simulators", value: "6", icon: ZapIcon },
          { label: "Diagrams", value: "15+", icon: LayersIcon },
          { label: "Code Examples", value: "10+", icon: DatabaseIcon },
        ].map((stat) => (
          <Card
            key={stat.label}
            className="border-border/30 bg-card/50"
          >
            <CardContent className="flex items-center gap-3 p-4">
              <stat.icon className="size-4 text-muted-foreground" />
              <div>
                <p className="font-mono text-lg font-semibold">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  );
}
