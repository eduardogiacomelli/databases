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
  Calculator,
  BookOpen,
  ArrowDownUp,
} from "lucide-react";
// IMPORT DO SEU COMPONENTE KATEX (Ajuste o caminho se necessário)
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
  isSubquery?: boolean;
  hasSideInput?: boolean;
  hasSideOutput?: boolean;
  algorithm?: string;
  cost?: string; // Expressão KaTeX
  columns?: SchemaColumn[];
};

/* ==============================================================================
   2. CUSTOM NODES (Atualizados para suportar o MathInline e evitar Hidratação)
   ============================================================================== */

const SchemaNode = ({ data }: NodeProps) => {
  const { label, columns } = data as CustomNodeData;
  return (
    <div className="w-56 bg-card border border-border rounded-lg shadow-lg flex flex-col text-sm font-sans z-20">
      <div className="bg-muted/60 px-3 py-2 font-bold border-b border-border flex justify-between items-center rounded-t-lg">
        <span className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          {label}
        </span>
      </div>
      <div className="flex flex-col p-1 bg-background rounded-b-lg">
        {columns?.map((c) => (
          <div
            key={c.name}
            className="relative flex justify-between items-center px-2 py-1.5 border-b last:border-0 border-border/40 hover:bg-muted/20 transition-colors"
          >
            {c.isPk && (
              <Handle
                type="target"
                position={Position.Left}
                id={`pk-${c.name}`}
                className="!w-2.5 !h-2.5 !bg-amber-500 !-left-1.5 border border-background"
              />
            )}

            <span className="font-mono text-[11px] flex items-center gap-1.5 text-foreground">
              {c.isPk && <Key className="w-3 h-3 text-amber-500" />}
              {!c.isPk && c.isFk && (
                <LinkIcon className="w-3 h-3 text-muted-foreground" />
              )}
              <span className={c.isPk ? "font-bold" : ""}>{c.name}</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {c.type}
            </span>

            {c.isFk && (
              <Handle
                type="source"
                position={Position.Right}
                id={`fk-${c.name}`}
                className="!w-2.5 !h-2.5 !bg-muted-foreground !-right-1.5 border border-background"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const RelationalNode = ({ data }: NodeProps) => {
  const { label, symbol, isSubquery, hasSideInput, algorithm, cost } =
    data as CustomNodeData;

  return (
    <div className="relative flex flex-col items-center">
      <div
        className={`min-w-[170px] px-4 py-2 bg-background border-2 ${isSubquery ? "border-amber-500/40" : "border-primary/40"} text-foreground font-mono rounded-xl shadow-md flex items-center justify-center gap-3 z-10`}
      >
        <Handle type="source" position={Position.Top} className="opacity-0" />
        {symbol && (
          <span
            className={`${isSubquery ? "text-amber-500" : "text-primary"} font-bold text-xl flex items-center justify-center`}
          >
            {symbol}
          </span>
        )}
        <span className="text-xs font-semibold whitespace-pre-wrap text-center leading-tight">
          {label}
        </span>
        <Handle
          type="target"
          position={Position.Bottom}
          className="opacity-0"
        />

        {hasSideInput && (
          <Handle
            type="target"
            position={Position.Right}
            id="var-in"
            className="!w-3 !h-3 !bg-amber-500 border-2 border-background"
          />
        )}
      </div>

      {/* Rótulo de Algoritmo e Custo Matemático com KaTeX */}
      {(algorithm || cost) && (
        <div className="absolute top-[105%] flex flex-col items-center w-[220px] pt-1 z-20">
          {algorithm && (
            <span className="text-[10px] font-sans font-bold text-destructive/80">
              {algorithm}
            </span>
          )}
          {cost && (
            <span className="text-[12px] font-bold text-destructive">
              <MathInline expression={cost} />
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const LeafNode = ({ data }: NodeProps) => {
  const { label, isSubquery, algorithm, cost } = data as CustomNodeData;
  return (
    <div className="relative flex flex-col items-center">
      <div
        className={`w-14 h-14 ${isSubquery ? "bg-amber-600 ring-amber-600/40" : "bg-blue-600 ring-blue-600/40"} text-white font-bold text-xl rounded-full shadow-lg flex items-center justify-center border-4 border-background ring-2 z-10`}
      >
        <Handle type="source" position={Position.Top} className="opacity-0" />
        {label}
      </div>

      {(algorithm || cost) && (
        <div className="absolute top-[110%] flex flex-col items-center w-[200px] pt-1 z-20">
          {algorithm && (
            <span className="text-[10px] font-sans font-bold text-destructive/80 text-center leading-tight">
              {algorithm}
            </span>
          )}
          {cost && (
            <span className="text-[12px] font-bold text-destructive">
              <MathInline expression={cost} />
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const VariableNode = ({ data }: NodeProps) => {
  const { label } = data as CustomNodeData;
  return (
    <div className="px-3 py-1.5 bg-amber-500/10 border-2 border-amber-500 text-amber-500 font-mono rounded shadow-sm flex items-center gap-2 text-xs font-bold">
      <Calculator className="w-3 h-3" />
      {label}
      <Handle type="target" position={Position.Bottom} className="opacity-0" />
      <Handle
        type="source"
        position={Position.Left}
        id="var-out"
        className="!w-3 !h-3 !bg-amber-500 border-2 border-background"
      />
    </div>
  );
};

// Edge com fundo sólido para não ser cortada pelas linhas azuis!
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
            className="nodrag nopan z-50 bg-background border border-border shadow-sm rounded-md px-1.5 py-0.5 text-[11px] font-bold text-destructive flex items-center justify-center"
          >
            {/* KaTeX perfeitamente isolado e imune à hidratação */}
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
  variable: VariableNode,
};
const edgeTypes = { annotated: AnnotatedEdge };

/* ==============================================================================
   3. DADOS INICIAIS DA ÁRVORE (EXERCÍCIO 2.3)
   ============================================================================== */

const initialNodes: Node[] = [
  // --- 1. ESQUEMA RELACIONAL ---
  {
    id: "s1",
    type: "schema",
    position: { x: 40, y: 40 },
    data: {
      label: "Médico",
      columns: [
        { name: "CRM", type: "INT", isPk: true },
        { name: "nome", type: "VARCHAR" },
        { name: "espec", type: "VARCHAR" },
        { name: "estado", type: "CHAR(2)" },
      ],
    },
  },
  {
    id: "s2",
    type: "schema",
    position: { x: 340, y: 40 },
    data: {
      label: "Atestado",
      columns: [
        { name: "codA", type: "INT", isPk: true },
        { name: "CRM", type: "INT", isFk: true },
        { name: "codP", type: "INT", isFk: true },
        { name: "codD", type: "INT", isFk: true },
        { name: "data", type: "DATE" },
        { name: "estado", type: "CHAR(2)" },
      ],
    },
  },
  {
    id: "s3",
    type: "schema",
    position: { x: 640, y: 40 },
    data: {
      label: "Doença",
      columns: [
        { name: "codD", type: "INT", isPk: true },
        { name: "espec", type: "VARCHAR" },
      ],
    },
  },
  {
    id: "s4",
    type: "schema",
    position: { x: 340, y: 280 },
    data: {
      label: "Paciente",
      columns: [
        { name: "codP", type: "INT", isPk: true },
        { name: "estado", type: "CHAR(2)" },
      ],
    },
  },

  // --- 2. ÁRVORE PRINCIPAL (Espaçada no Eixo Y para respirar) ---
  // Ramo Médico (M)
  {
    id: "leafM",
    type: "leaf",
    position: { x: 300, y: 1300 },
    data: {
      label: "M",
      algorithm: "Busca via índ. p/ estado",
      cost: "O(\\log|M| + k_M)",
    },
  },
  {
    id: "sigM",
    type: "operator",
    position: { x: 260, y: 1180 },
    data: { symbol: "σ", label: "estado = 'SC'" },
  },
  {
    id: "piM",
    type: "operator",
    position: { x: 260, y: 1060 },
    data: { symbol: "π", label: "CRM, nome, espec" },
  },

  // Ramo Atestado (A)
  {
    id: "leafA",
    type: "leaf",
    position: { x: 500, y: 1300 },
    data: {
      label: "A",
      algorithm: "Busca via índ. p/ data",
      cost: "O(\\log|A| + k_A)",
    },
  },
  {
    id: "sigA",
    type: "operator",
    position: { x: 460, y: 1180 },
    data: { symbol: "σ", label: "data >= '01/01/12'" },
  },
  {
    id: "piA",
    type: "operator",
    position: { x: 460, y: 1060 },
    data: { symbol: "π", label: "codA, CRM, codP,\ncodD, estado" },
  },

  // Join M e A
  {
    id: "joinMA",
    type: "operator",
    position: { x: 360, y: 920 },
    data: {
      symbol: "⨝",
      label: "M.CRM = A.CRM AND\nM.estado = A.estado",
      algorithm: "Hash Join",
      cost: "O(k_A + k_M)",
    },
  },

  // Ramo Doença (D) - Scan ou índice primário
  {
    id: "leafD",
    type: "leaf",
    position: { x: 700, y: 1060 },
    data: { label: "D", algorithm: "Busca exaustiva", cost: "O(|D|)" },
  },
  {
    id: "joinMAD",
    type: "operator",
    position: { x: 530, y: 780 },
    data: {
      symbol: "⨝",
      label: "A.codD = D.codD AND\nM.espec ≠ D.espec",
      algorithm: "Hash Join",
      cost: "O(k_{AM} + |D|)",
    },
  },

  // Ramo Paciente (P)
  {
    id: "leafP",
    type: "leaf",
    position: { x: 880, y: 1060 },
    data: {
      label: "P",
      algorithm: "Busca via índ. p/ estado",
      cost: "O(\\log|P| + k_P)",
    },
  },
  {
    id: "sigP",
    type: "operator",
    position: { x: 840, y: 920 },
    data: { symbol: "σ", label: "estado = 'SC'" },
  },

  // Join Final c/ Paciente
  {
    id: "joinMADP",
    type: "operator",
    position: { x: 680, y: 640 },
    data: {
      symbol: "⨝",
      label: "A.codP = P.codP",
      algorithm: "Hash Join",
      cost: "O(k'_{AM} + k_P)",
    },
  },

  // Agrupamento, Having e Ordenação
  {
    id: "agg",
    type: "operator",
    position: { x: 650, y: 500 },
    data: {
      symbol: "π",
      label: "M.CRM, M.nome,\nCOUNT(A.*) AS nAtests",
      algorithm: "Hash Aggregation",
      cost: "O(k'')",
    },
  },
  {
    id: "having",
    type: "operator",
    position: { x: 650, y: 360 },
    data: { symbol: "σ", label: "nAtests > MédiaAtests", hasSideInput: true },
  },
  {
    id: "sort",
    type: "operator",
    position: { x: 650, y: 220 },
    data: {
      symbol: <ArrowDownUp className="w-5 h-5" />,
      label: "ORDER BY nAtests DESC",
      algorithm: "Merge Sort",
      cost: "O(k''' \\log k''')",
    },
  },
  {
    id: "piFinal",
    type: "operator",
    position: { x: 670, y: 80 },
    data: { symbol: "π", label: "CRM, nome, nAtests" },
  },

  // --- 3. SUBQUERY ---
  {
    id: "varMedia",
    type: "variable",
    position: { x: 1050, y: 360 },
    data: { label: "MédiaAtests" },
  },
  {
    id: "div",
    type: "operator",
    position: { x: 1040, y: 460 },
    data: { symbol: "÷", label: "Divisão", isSubquery: true },
  },
  {
    id: "countAtest",
    type: "operator",
    position: { x: 940, y: 580 },
    data: { symbol: "π", label: "COUNT(*)", isSubquery: true },
  },
  {
    id: "countDist",
    type: "operator",
    position: { x: 1140, y: 580 },
    data: { symbol: "π", label: "COUNT(DISTINCT CRM)", isSubquery: true },
  },
  {
    id: "leafSubA",
    type: "leaf",
    position: { x: 1040, y: 700 },
    data: {
      label: "A",
      isSubquery: true,
      algorithm: "Busca exaustiva",
      cost: "O(|A|)",
    },
  },
];

/* ==============================================================================
   4. DEFINIÇÃO DAS ARESTAS E CONEXÕES
   ============================================================================== */

const schemaEdge = {
  type: "smoothstep",
  animated: true,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "var(--color-muted-foreground)",
  },
  style: {
    strokeWidth: 1.5,
    stroke: "var(--color-muted-foreground)",
    strokeDasharray: "4 4",
  },
};
const treeEdge = {
  type: "annotated",
  markerEnd: { type: MarkerType.ArrowClosed, color: "var(--color-primary)" },
  style: { strokeWidth: 2, stroke: "var(--color-primary)" },
};
const subEdge = {
  type: "annotated",
  markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b" },
  style: { strokeWidth: 2, stroke: "#f59e0b" },
};
const varEdge = {
  type: "smoothstep",
  animated: true,
  markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b" },
  style: { strokeWidth: 2, stroke: "#f59e0b", strokeDasharray: "6 6" },
};

const initialEdges: Edge[] = [
  // Esquema: FK -> PK
  {
    id: "fk1",
    source: "s2",
    sourceHandle: "fk-CRM",
    target: "s1",
    targetHandle: "pk-CRM",
    ...schemaEdge,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
    style: { strokeWidth: 1.5, stroke: "#10b981", strokeDasharray: "4 4" },
  },
  {
    id: "fk2",
    source: "s2",
    sourceHandle: "fk-codP",
    target: "s4",
    targetHandle: "pk-codP",
    ...schemaEdge,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#06b6d4" },
    style: { strokeWidth: 1.5, stroke: "#06b6d4", strokeDasharray: "4 4" },
  },
  {
    id: "fk3",
    source: "s2",
    sourceHandle: "fk-codD",
    target: "s3",
    targetHandle: "pk-codD",
    ...schemaEdge,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#ec4899" },
    style: { strokeWidth: 1.5, stroke: "#ec4899", strokeDasharray: "4 4" },
  },

  // Árvore Principal (Propriedade `cost` envia o KaTeX)
  { id: "e1", source: "leafM", target: "sigM", ...treeEdge },
  {
    id: "e2",
    source: "sigM",
    target: "piM",
    ...treeEdge,
    data: { cost: "k_M" },
  },
  {
    id: "e3",
    source: "piM",
    target: "joinMA",
    ...treeEdge,
    data: { cost: "k_M" },
  },

  { id: "e4", source: "leafA", target: "sigA", ...treeEdge },
  {
    id: "e5",
    source: "sigA",
    target: "piA",
    ...treeEdge,
    data: { cost: "k_A" },
  },
  {
    id: "e6",
    source: "piA",
    target: "joinMA",
    ...treeEdge,
    data: { cost: "k_A" },
  },

  {
    id: "e7",
    source: "joinMA",
    target: "joinMAD",
    ...treeEdge,
    data: { cost: "k_{AM}" },
  },
  {
    id: "e8",
    source: "leafD",
    target: "joinMAD",
    ...treeEdge,
    data: { cost: "|D|" },
  },

  {
    id: "e9",
    source: "joinMAD",
    target: "joinMADP",
    ...treeEdge,
    data: { cost: "k'_{AM}" },
  },
  { id: "e10", source: "leafP", target: "sigP", ...treeEdge },
  {
    id: "e11",
    source: "sigP",
    target: "joinMADP",
    ...treeEdge,
    data: { cost: "k_P" },
  },

  {
    id: "e12",
    source: "joinMADP",
    target: "agg",
    ...treeEdge,
    data: { cost: "k''" },
  },
  {
    id: "e13",
    source: "agg",
    target: "having",
    ...treeEdge,
    data: { cost: "k'''" },
  },
  { id: "e14", source: "having", target: "sort", ...treeEdge },
  { id: "e15", source: "sort", target: "piFinal", ...treeEdge },

  // Subquery
  { id: "e16", source: "leafSubA", target: "countAtest", ...subEdge },
  { id: "e17", source: "leafSubA", target: "countDist", ...subEdge },
  { id: "e18", source: "countAtest", target: "div", ...subEdge },
  { id: "e19", source: "countDist", target: "div", ...subEdge },
  { id: "e20", source: "div", target: "varMedia", ...subEdge },

  {
    id: "e21",
    source: "varMedia",
    target: "having",
    sourceHandle: "var-out",
    targetHandle: "var-in",
    ...varEdge,
  },
];

/* ==============================================================================
   5. RENDERIZAÇÃO DA PÁGINA
   ============================================================================== */

export default function ExercicioComplexoOptimization() {
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
          fitViewOptions={{ padding: 0.1 }}
          minZoom={0.1}
          className="bg-grid"
        >
          <Background gap={24} size={1} color="var(--color-border)" />

          <Panel
            position="top-center"
            className="bg-background/90 backdrop-blur-md px-6 py-3 rounded-b-xl border border-t-0 shadow-md"
          >
            <h1 className="text-xl font-bold font-heading text-foreground text-center flex items-center gap-3">
              Complexidade Total:
              <span className="text-destructive">
                <MathInline expression="O(|A| + \log|M| + k_M + |D| + \log|P| + k_P + k''' \log k''')" />
              </span>
            </h1>
          </Panel>

          <Panel
            position="top-right"
            className="bg-background/95 backdrop-blur-md p-5 rounded-xl border-2 border-primary/20 shadow-xl m-6 w-[440px] pointer-events-none"
          >
            <h3 className="font-bold text-lg text-primary mb-4 flex items-center gap-2 border-b border-primary/20 pb-2">
              <BookOpen className="w-5 h-5" /> Algoritmos Otimizados
            </h3>

            <div className="flex flex-col gap-4 text-sm font-medium text-muted-foreground">
              <div>
                <strong className="text-foreground">
                  Custo de Ordenação (ORDER BY)
                </strong>
                <p className=" mt-1 leading-relaxed">
                  Usado no topo da árvore. Como o{" "}
                  <MathInline expression="k'''" /> gerado pelo{" "}
                  <strong>HAVING</strong> não está ordenado, é necessário um{" "}
                  <em>Merge Sort</em> em memória.
                  <br />
                  <span className="text-destructive font-bold mt-1 inline-block">
                    <MathInline expression="O(k''' \log k''')" />
                  </span>
                </p>
              </div>

              <div>
                <strong className="text-foreground">
                  Sequência de Hash Joins
                </strong>
                <p className=" mt-1 leading-relaxed">
                  Nenhuma das chaves secundárias (
                  <MathInline expression="CRM" />,{" "}
                  <MathInline expression="codP" />, etc) está ordenada após os
                  filtros de estado/data. O banco escolhe Hash Join para cruzar
                  os resultados intermediários (
                  <MathInline expression="k_{AM}" />,{" "}
                  <MathInline expression="K'_{AM}" />
                  ).
                </p>
              </div>

              <div className="mt-2 pt-3 border-t border-border/50">
                <span className=" font-bold text-foreground">
                  Anotações Matemáticas:
                </span>
                <ul className=" mt-1 grid grid-cols-2 gap-y-2 text-destructive">
                  <li>
                    <MathInline expression="k_M" /> = Médicos SC
                  </li>
                  <li>
                    <MathInline expression="k_A" /> = Atests desde 2012
                  </li>
                  <li>
                    <MathInline expression="k_P" /> = Pacientes SC
                  </li>
                  <li>
                    <MathInline expression="k_{AM}" /> = Join Inicial
                  </li>
                  <li>
                    <MathInline expression="k''" /> = Casos p/ Agrupar
                  </li>
                  <li>
                    <MathInline expression="k'''" /> = Casos pós Having
                  </li>
                </ul>
              </div>
            </div>
          </Panel>

          <Controls className="bg-background border-border fill-foreground" />
        </ReactFlow>
      </div>
    </div>
  );
}
