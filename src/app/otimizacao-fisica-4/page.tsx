"use client";

import React from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps,
  EdgeProps,
  BaseEdge,
  getSmoothStepPath,
  MarkerType,
  Panel,
  Node,
  Edge,
  EdgeLabelRenderer,
} from "@xyflow/react";
import {
  Key,
  Database,
  Link as LinkIcon,
  BookOpen,
  ArrowDownUp,
} from "lucide-react";
import { MathInline } from "@/components/content/math-block";
/* ==============================================================================
   1. TIPAGENS DO TYPESCRIPT
   ============================================================================== */

type SchemaColumn = {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
};

type CustomNodeData = {
  label?: string;
  symbol?: string | React.ReactNode;
  algorithm?: string;
  cost?: string;
  columns?: SchemaColumn[];
};

/* ==============================================================================
   2. CUSTOM NODES
   ============================================================================== */

const SchemaNode = ({ data }: NodeProps) => {
  const { label, columns } = data as CustomNodeData;
  return (
    <div className="w-64 bg-card border border-border rounded-xl shadow-lg flex flex-col text-sm font-sans z-20">
      <div className="bg-muted/60 px-4 py-2.5 font-bold border-b border-border flex justify-between items-center rounded-t-xl text-base">
        <span className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          {label}
        </span>
      </div>
      <div className="flex flex-col p-1.5 bg-background rounded-b-xl">
        {columns?.map((c) => (
          <div
            key={c.name}
            className="relative flex justify-between items-center px-2.5 py-2 border-b last:border-0 border-border/40 hover:bg-muted/20 transition-colors"
          >
            {c.isPk && (
              <Handle
                type="target"
                position={Position.Left}
                id={`pk-${c.name}`}
                className="!w-3 !h-3 !bg-amber-500 !-left-2 border-2 border-background"
              />
            )}
            <span className="font-mono text-xs flex items-center gap-2 text-foreground">
              {c.isPk && <Key className="w-3.5 h-3.5 text-amber-500" />}
              {!c.isPk && c.isFk && (
                <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className={c.isPk ? "font-bold" : ""}>{c.name}</span>
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              {c.type}
            </span>
            {c.isFk && (
              <Handle
                type="source"
                position={Position.Right}
                id={`fk-${c.name}`}
                className="!w-3 !h-3 !bg-muted-foreground !-right-2 border-2 border-background"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const RelationalNode = ({ data }: NodeProps) => {
  const { label, symbol, algorithm, cost } = data as CustomNodeData;
  return (
    <div className="relative flex flex-col items-center">
      <div className="min-w-[210px] px-5 py-3 bg-background border-2 border-primary/40 text-foreground font-mono rounded-xl shadow-md flex items-center justify-center gap-4 z-10">
        <Handle type="source" position={Position.Top} className="opacity-0" />
        {symbol && (
          <span className="text-primary font-bold text-2xl flex items-center justify-center">
            {symbol}
          </span>
        )}
        <span className="text-sm font-semibold whitespace-pre-wrap text-center leading-tight">
          {label}
        </span>
        <Handle
          type="target"
          position={Position.Bottom}
          className="opacity-0"
        />
      </div>
      {(algorithm || cost) && (
        <div className="absolute top-[105%] flex flex-col items-center w-[280px] pt-1.5 z-20">
          {algorithm && (
            <span className="text-xs font-sans font-bold text-destructive/80 text-center leading-tight mb-0.5">
              {algorithm}
            </span>
          )}
          {cost && (
            <span className="text-sm font-bold text-destructive bg-background/50 px-2 rounded backdrop-blur-sm">
              <MathInline expression={cost} />
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const LeafNode = ({ data }: NodeProps) => {
  const { label, algorithm, cost } = data as CustomNodeData;
  return (
    <div className="relative flex flex-col items-center">
      <div className="w-16 h-16 bg-blue-600 ring-blue-600/40 text-white font-bold text-2xl rounded-full shadow-lg flex items-center justify-center border-[5px] border-background ring-2 z-10">
        <Handle type="source" position={Position.Top} className="opacity-0" />
        {label}
      </div>
      {(algorithm || cost) && (
        <div className="absolute top-[110%] flex flex-col items-center w-[220px] pt-1.5 z-20">
          {algorithm && (
            <span className="text-xs font-sans font-bold text-destructive/80 text-center leading-tight mb-0.5">
              {algorithm}
            </span>
          )}
          {cost && (
            <span className="text-sm font-bold text-destructive bg-background/50 px-2 rounded backdrop-blur-sm">
              <MathInline expression={cost} />
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const AnnotatedEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {data?.cost && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan z-50 bg-background border border-border shadow-sm rounded-md px-2 py-1 text-[13px] font-bold text-destructive flex items-center justify-center"
          >
            <MathInline expression={data.cost as string} />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const nodeTypes = {
  schema: SchemaNode,
  operator: RelationalNode,
  leaf: LeafNode,
};
const edgeTypes = { annotated: AnnotatedEdge };

/* ==============================================================================
   3. DADOS INICIAIS DA ÁRVORE (Com Agregação Antecipada / Junção Tardia)
   ============================================================================== */

const initialNodes: Node[] = [
  // --- 1. ESQUEMA RELACIONAL (Centralizado em Migra) ---
  {
    id: "s1",
    type: "schema",
    position: { x: 100, y: 250 },
    data: {
      label: "Individuo",
      columns: [
        { name: "idI", type: "INT", isPk: true },
        { name: "dtNasc", type: "DATE" },
      ],
    },
  },
  {
    id: "s2",
    type: "schema",
    position: { x: -150, y: 0 },
    data: {
      label: "Migra",
      columns: [
        { name: "idI", type: "INT", isFk: true },
        { name: "idPO", type: "INT", isFk: true },
        { name: "idPD", type: "INT", isFk: true },
        { name: "dtMigra", type: "DATE" },
      ],
    },
  },
  {
    id: "s3",
    type: "schema",
    position: { x: -50, y: 450 },
    data: {
      label: "Pais",
      columns: [
        { name: "idP", type: "INT", isPk: true },
        { name: "nome", type: "VARCHAR" },
      ],
    },
  },

  // --- 2. ÁRVORE PRINCIPAL (Metade Inferior Clássica) ---
  {
    id: "leafPO",
    type: "leaf",
    position: { x: 200, y: 1200 },
    data: {
      label: "PO",
      algorithm: "Busca índ. (chave cand.)",
      cost: "O(\\log|Pais| + 1)",
    },
  },
  {
    id: "sigPO",
    type: "operator",
    position: { x: 160, y: 1050 },
    data: { symbol: "σ", label: "nome = 'Brasil'" },
  },

  {
    id: "leafM",
    type: "leaf",
    position: { x: 500, y: 1050 },
    data: { label: "M" },
  },

  {
    id: "joinM",
    type: "operator",
    position: { x: 330, y: 880 },
    data: {
      symbol: "⨝",
      label: "M.idPO = PO.idP",
      algorithm: "Laço aninhado c/ busca",
      cost: "O(1 \\cdot \\log|M| + k_{PO})",
    },
  },
  {
    id: "sigM",
    type: "operator",
    position: { x: 330, y: 740 },
    data: { symbol: "σ", label: "dtMigra >= '01/01/2020'" },
  },

  {
    id: "leafI",
    type: "leaf",
    position: { x: 650, y: 740 },
    data: { label: "I" },
  },

  {
    id: "joinI",
    type: "operator",
    position: { x: 490, y: 600 },
    data: {
      symbol: "⨝",
      label: "I.idI = M.idI",
      algorithm: "Laço aninhado c/ busca",
      cost: "O(k_{MB20} \\log|I| + k_{MBI})",
    },
  },
  {
    id: "sigI",
    type: "operator",
    position: { x: 490, y: 460 },
    data: { symbol: "σ", label: "dtNasc >= '01/01/2000'" },
  },

  // --- 3. TOPO DA ÁRVORE (A Otimização Avançada do Usuário) ---

  // Agregação ACONTECE ANTES do último Join!
  {
    id: "agg",
    type: "operator",
    position: { x: 490, y: 300 },
    data: {
      symbol: "π",
      label: "M.idPD, COUNT(M.*) AS n",
      algorithm: "Hash Aggregation (Memória)",
      cost: "O(k_{MBI2000})",
    },
  },

  // O Having corta os destinos impopulares
  {
    id: "hav",
    type: "operator",
    position: { x: 490, y: 160 },
    data: { symbol: "σ", label: "n > 10000" },
  },

  // Folha do País Destino (Agora puxada para o topo)
  {
    id: "leafPD",
    type: "leaf",
    position: { x: 800, y: 160 },
    data: { label: "PD" },
  },

  // O Join TARDIO. Somente os k_hav países sobreviventes buscam PD.* no disco
  {
    id: "joinPD",
    type: "operator",
    position: { x: 640, y: 20 },
    data: {
      symbol: "⨝",
      label: "M.idPD = PD.idP",
      algorithm: "Laço aninhado c/ busca",
      cost: "O(k_{hav} \\log|Pais| + k_{hav})",
    },
  },
  {
    id: "piFinal",
    type: "operator",
    position: { x: 640, y: -120 },
    data: { symbol: "π", label: "PD.*, n" },
  },
  // Ordenação e Projeção Final
  {
    id: "sort",
    type: "operator",
    position: { x: 640, y: -240 },
    data: {
      symbol: <ArrowDownUp className="w-5 h-5" />,
      label: "ORDER BY n DESC",
      algorithm: "Merge Sort",
      cost: "O(k_{hav} \\log k_{hav})",
    },
  },
];

const schemaEdge = {
  type: "smoothstep",
  animated: true,
  markerEnd: { type: MarkerType.ArrowClosed },
  style: { strokeWidth: 2, strokeDasharray: "5 5" },
};
const treeEdge = {
  type: "annotated",
  markerEnd: { type: MarkerType.ArrowClosed, color: "var(--color-primary)" },
  style: { strokeWidth: 2.5, stroke: "var(--color-primary)" },
};

const initialEdges: Edge[] = [
  // --- ARESTAS DO ESQUEMA ---
  {
    id: "fk1",
    source: "s2",
    sourceHandle: "fk-idI",
    target: "s1",
    targetHandle: "pk-idI",
    ...schemaEdge,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
    style: { ...schemaEdge.style, stroke: "#10b981" },
  },
  {
    id: "fk2",
    source: "s2",
    sourceHandle: "fk-idPO",
    target: "s3",
    targetHandle: "pk-idP",
    ...schemaEdge,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#ec4899" },
    style: { ...schemaEdge.style, stroke: "#ec4899" },
  },
  {
    id: "fk3",
    source: "s2",
    sourceHandle: "fk-idPD",
    target: "s3",
    targetHandle: "pk-idP",
    ...schemaEdge,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#06b6d4" },
    style: { ...schemaEdge.style, stroke: "#06b6d4" },
  },

  // --- ÁRVORE PRINCIPAL (Fluxo Otimizado) ---
  {
    id: "e1",
    source: "leafPO",
    target: "sigPO",
    ...treeEdge,
    data: { cost: "1" },
  },
  {
    id: "e2",
    source: "sigPO",
    target: "joinM",
    ...treeEdge,
    data: { cost: "1" },
  },
  { id: "e3", source: "leafM", target: "joinM", ...treeEdge },

  {
    id: "e4",
    source: "joinM",
    target: "sigM",
    ...treeEdge,
    data: { cost: "k_{PO}" },
  },
  {
    id: "e5",
    source: "sigM",
    target: "joinI",
    ...treeEdge,
    data: { cost: "k_{MB20}" },
  },
  { id: "e6", source: "leafI", target: "joinI", ...treeEdge },

  {
    id: "e7",
    source: "joinI",
    target: "sigI",
    ...treeEdge,
    data: { cost: "k_{MBI}" },
  },

  // Agregação Antecipada: O fluxo vai do Sigma do Indivíduo direto para o Group By!
  {
    id: "e8",
    source: "sigI",
    target: "agg",
    ...treeEdge,
    data: { cost: "k_{MBI2000}" },
  },
  {
    id: "e9",
    source: "agg",
    target: "hav",
    ...treeEdge,
    data: { cost: "k_{dest}" },
  },

  // O Join é feito depois do Having, apenas com o k_hav minúsculo
  {
    id: "e10",
    source: "hav",
    target: "joinPD",
    ...treeEdge,
    data: { cost: "k_{hav}" },
  },
  { id: "e11", source: "leafPD", target: "joinPD", ...treeEdge },

  {
    id: "e12",
    source: "joinPD",
    target: "piFinal",
    ...treeEdge,
    data: { cost: "k_{hav}" },
  },
  { id: "e13", source: "piFinal", target: "sort", ...treeEdge },
];

export default function MigracaoOtimizacaoAvancada() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="flex h-screen w-full flex-col">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.1}
          className="bg-grid"
        >
          <Background gap={24} size={1} color="var(--color-border)" />

          <Panel
            position="top-center"
            className="bg-background/95 backdrop-blur-md px-8 py-4 rounded-b-2xl border border-t-0 shadow-lg"
          >
            <h1 className="text-2xl font-bold font-heading text-foreground text-center flex flex-col items-center gap-2">
              Complexidade Total (Agregação Antecipada)
              <span className="text-destructive mt-1">
                <MathInline expression="O(\log|\text{Pais}| + \log|M| + k_{MB20}\log|I| + k_{MBI2000} + k_{hav}\log|\text{Pais}|)" />
              </span>
            </h1>
          </Panel>

          <Panel
            position="top-right"
            className="bg-background/95 backdrop-blur-md p-6 rounded-2xl border-2 border-primary/20 shadow-2xl m-6 w-[480px] pointer-events-none"
          >
            <h3 className="font-bold text-xl text-primary mb-5 flex items-center gap-2 border-b border-primary/20 pb-3">
              <BookOpen className="w-6 h-6" /> Late Materialization (Sua Ideia!)
            </h3>

            <div className="flex flex-col gap-5 text-sm font-medium text-muted-foreground">
              <div>
                <strong className="text-foreground text-base">
                  O Problema do Join Precoce
                </strong>
                <p className="text-[13px] mt-1.5 leading-relaxed">
                  Fazer o Join com <MathInline expression="PD" /> antes de
                  agrupar faria o banco de dados acessar o disco da tabela País
                  para <MathInline expression="k_{MBI2000}" /> registros (talvez
                  milhões de brasileiros). É um desperdício enorme de I/O, visto
                  que muitos emigraram para os mesmos destinos.
                </p>
              </div>

              <div>
                <strong className="text-foreground text-base">
                  A Solução: Agregação Antecipada
                </strong>
                <p className="text-[13px] mt-1.5 leading-relaxed">
                  Como o agrupamento é por <MathInline expression="PD.*" /> (que
                  depende unicamente de <MathInline expression="PD.idP" />
                  ), nós agrupamos os dados pela Chave Estrangeira{" "}
                  <MathInline expression="M.idPD" /> que já está na memória RAM,
                  gerando a contagem de forma ultrarrápida com{" "}
                  <em>Hash Aggregation</em>.
                </p>
              </div>

              <div>
                <strong className="text-foreground text-base">
                  O Late Join
                </strong>
                <p className="text-[13px] mt-1.5 leading-relaxed">
                  O filtro do <strong>HAVING</strong> joga fora quase todos os
                  agrupamentos, deixando apenas{" "}
                  <MathInline expression="k_{hav}" /> destinos hiperpopulares
                  (ex: 5 países). Somente então fazemos o Join com a tabela País
                  para buscar os dados desses 5 países, reduzindo o custo de I/O
                  do topo da árvore a quase zero.
                </p>
              </div>
            </div>
          </Panel>
          <Controls className="bg-background border-border fill-foreground" />
        </ReactFlow>
      </div>
    </div>
  );
}
