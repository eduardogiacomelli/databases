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
} from "lucide-react";
// IMPORT DO SEU COMPONENTE KATEX
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
   2. CUSTOM NODES (Com suporte a KaTeX e imunes a Hidratação)
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
        className={`min-w-[160px] px-4 py-2 bg-background border-2 ${isSubquery ? "border-amber-500/40" : "border-primary/40"} text-foreground font-mono rounded-xl shadow-md flex items-center justify-center gap-3 z-10`}
      >
        <Handle type="source" position={Position.Top} className="opacity-0" />
        {symbol && (
          <span
            className={`${isSubquery ? "text-amber-500" : "text-primary"} font-bold text-xl`}
          >
            {symbol}
          </span>
        )}
        <span className="text-xs font-semibold whitespace-pre-wrap text-center">
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

      {(algorithm || cost) && (
        <div className="absolute top-[105%] flex flex-col items-center w-[250px] pt-1 z-20">
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

// Edge Renderizada com background sólido e KaTeX
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
   3. DADOS INICIAIS
   ============================================================================== */

const initialNodes: Node[] = [
  // --- 1. ESQUEMA RELACIONAL ---
  {
    id: "s1",
    type: "schema",
    position: { x: 50, y: 50 },
    data: {
      label: "Agente",
      columns: [
        { name: "codAg", type: "INT", isPk: true },
        { name: "tipo", type: "VARCHAR" },
        { name: "nome", type: "VARCHAR" },
      ],
    },
  },
  {
    id: "s3",
    type: "schema",
    position: { x: 350, y: 50 },
    data: {
      label: "Ocasiona",
      columns: [
        { name: "codAg", type: "INT", isPk: true, isFk: true },
        { name: "codd", type: "INT", isPk: true, isFk: true },
      ],
    },
  },
  {
    id: "s2",
    type: "schema",
    position: { x: 650, y: 50 },
    data: {
      label: "Doença",
      columns: [
        { name: "codd", type: "INT", isPk: true },
        { name: "nome", type: "VARCHAR" },
      ],
    },
  },
  {
    id: "s4",
    type: "schema",
    position: { x: 350, y: 200 },
    data: {
      label: "Caso",
      columns: [
        { name: "codc", type: "INT", isPk: true },
        { name: "codAg", type: "INT", isFk: true },
        { name: "codd", type: "INT", isFk: true },
        { name: "data", type: "DATE" },
        { name: "uf", type: "CHAR(2)" },
        { name: "situação", type: "VARCHAR" },
      ],
    },
  },

  // --- 2. ÁRVORE PRINCIPAL ---
  {
    id: "leafA",
    type: "leaf",
    position: { x: 350, y: 1050 },
    data: {
      label: "A",
      algorithm: "Busca via índ. p/ tipo",
      cost: "O(\\log|A| + k_A)",
    },
  },
  {
    id: "sigA",
    type: "operator",
    position: { x: 290, y: 900 },
    data: { symbol: "σ", label: "tipo = 'protozoário'" },
  },
  {
    id: "piA",
    type: "operator",
    position: { x: 290, y: 780 },
    data: { symbol: "π", label: "codag, nome" },
  },

  {
    id: "leafO",
    type: "leaf",
    position: { x: 550, y: 900 },
    data: { label: "O" },
  },
  {
    id: "joinAO",
    type: "operator",
    position: { x: 400, y: 600 },
    data: {
      symbol: "⨝",
      label: "A.codag = O.codag",
      algorithm: "Laço aninhado com busca",
      cost: "O(k_A \\log|O| + K_{AO})",
    },
  },

  {
    id: "leafC",
    type: "leaf",
    position: { x: 800, y: 1050 },
    data: {
      label: "C",
      algorithm: "Busca via índ. (bitmap)",
      cost: "O(k_c)",
    },
  },
  {
    id: "sigC",
    type: "operator",
    position: { x: 700, y: 900 },
    data: {
      symbol: "σ",
      label: "situação = 'Óbito'\nuf = 'SC'\ndata >= '26/09/2012'",
    },
  },
  {
    id: "piC",
    type: "operator",
    position: { x: 740, y: 780 },
    data: { symbol: "π", label: "codc, codd" },
  },

  {
    id: "joinOC",
    type: "operator",
    position: { x: 570, y: 450 },
    data: {
      symbol: "⨝",
      label: "O.codd = C.codd",
      algorithm: "Hash Join",
      cost: "O(K_{AO} + k'_c)",
    },
  },

  {
    id: "agg",
    type: "operator",
    position: { x: 530, y: 310 },
    data: {
      symbol: "π",
      label: "A.nome, COUNT(C.codc)\nAS nroCasos",
      algorithm: "Hash Aggregation",
      cost: "O(k)",
    },
  },
  {
    id: "having",
    type: "operator",
    position: { x: 530, y: 160 },
    data: {
      symbol: "σ",
      label: "nroCasos > MediaCasos",
      hasSideInput: true,
      cost: "k' \\ll k",
    },
  },
  {
    id: "piFinal",
    type: "operator",
    position: { x: 570, y: 40 },
    data: { symbol: "π", label: "A.nome, nroCasos" },
  },

  // --- 3. SUBQUERY ---
  {
    id: "varMedia",
    type: "variable",
    position: { x: 950, y: 160 },
    data: { label: "MediaCasos" },
  },
  {
    id: "div",
    type: "operator",
    position: { x: 940, y: 250 },
    data: { symbol: "÷", label: "Divisão", isSubquery: true },
  },

  {
    id: "countC",
    type: "operator",
    position: { x: 840, y: 360 },
    data: { symbol: "π", label: "COUNT(*)", isSubquery: true },
  },
  {
    id: "leafSubC",
    type: "leaf",
    position: { x: 880, y: 490 },
    data: {
      label: "C",
      isSubquery: true,
      algorithm: "Busca exaustiva (scan)",
      cost: "O(|C|)",
    },
  },

  {
    id: "countA",
    type: "operator",
    position: { x: 1040, y: 360 },
    data: { symbol: "π", label: "COUNT(*)", isSubquery: true },
  },
  {
    id: "leafSubA",
    type: "leaf",
    position: { x: 1080, y: 490 },
    data: {
      label: "A",
      isSubquery: true,
      algorithm: "Busca exaustiva (scan)",
      cost: "O(|A|)",
    },
  },
];

/* ==============================================================================
   4. DEFINIÇÃO DAS ARESTAS E CONEXÕES
   ============================================================================== */

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
  // --- ARESTAS DO ESQUEMA ---
  {
    id: "fk1",
    source: "s3",
    sourceHandle: "fk-codAg",
    target: "s1",
    targetHandle: "pk-codAg",
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
    style: { strokeWidth: 1.5, stroke: "#10b981", strokeDasharray: "4 4" },
  },
  {
    id: "fk2",
    source: "s3",
    sourceHandle: "fk-codd",
    target: "s2",
    targetHandle: "pk-codd",
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#ec4899" },
    style: { strokeWidth: 1.5, stroke: "#ec4899", strokeDasharray: "4 4" },
  },
  {
    id: "fk3",
    source: "s4",
    sourceHandle: "fk-codAg",
    target: "s1",
    targetHandle: "pk-codAg",
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#06b6d4" },
    style: { strokeWidth: 1.5, stroke: "#06b6d4", strokeDasharray: "4 4" },
  },
  {
    id: "fk4",
    source: "s4",
    sourceHandle: "fk-codd",
    target: "s2",
    targetHandle: "pk-codd",
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#8b5cf6" },
    style: { strokeWidth: 1.5, stroke: "#8b5cf6", strokeDasharray: "4 4" },
  },

  // --- Árvore Principal ---
  { id: "e1", source: "leafA", target: "sigA", ...treeEdge },
  {
    id: "e2",
    source: "sigA",
    target: "piA",
    ...treeEdge,
    data: { cost: "k_A" },
  },
  {
    id: "e3",
    source: "piA",
    target: "joinAO",
    ...treeEdge,
    data: { cost: "k_A" },
  },
  { id: "e4", source: "leafO", target: "joinAO", ...treeEdge },

  { id: "e5", source: "leafC", target: "sigC", ...treeEdge },
  {
    id: "e6",
    source: "sigC",
    target: "piC",
    ...treeEdge,
    data: { cost: "k_c" },
  },

  {
    id: "e7",
    source: "joinAO",
    target: "joinOC",
    ...treeEdge,
    data: { cost: "K_{AO}" },
  },
  {
    id: "e8",
    source: "piC",
    target: "joinOC",
    ...treeEdge,
    data: { cost: "k'_c" },
  },

  { id: "e9", source: "joinOC", target: "agg", ...treeEdge },
  {
    id: "e10",
    source: "agg",
    target: "having",
    ...treeEdge,
    data: { cost: "k" },
  },
  {
    id: "e11",
    source: "having",
    target: "piFinal",
    ...treeEdge,
    data: { cost: "k'" },
  },

  // --- Subquery (Média) ---
  { id: "e12", source: "leafSubC", target: "countC", ...subEdge },
  { id: "e13", source: "leafSubA", target: "countA", ...subEdge },
  { id: "e14", source: "countC", target: "div", ...subEdge },
  { id: "e15", source: "countA", target: "div", ...subEdge },
  { id: "e16", source: "div", target: "varMedia", ...subEdge },

  // Variável para o HAVING
  {
    id: "e17",
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

export default function AgenteDoencaOptimization() {
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
            <h1 className="text-2xl font-bold font-heading text-foreground text-center flex items-center gap-3">
              Complexidade Total:{" "}
              <span className="text-destructive font-mono ml-2">
                <MathInline expression="O(\log|O| + K_{AO} + |C| + |A|)" />
              </span>
            </h1>
          </Panel>

          {/* Painel Direito - LEGENDA SEGURA CONTRA HIDRATAÇÃO */}
          <Panel
            position="top-right"
            className="bg-background/95 backdrop-blur-md p-5 rounded-xl border-2 border-primary/20 shadow-xl m-6 w-[420px] pointer-events-none"
          >
            <h3 className="font-bold text-lg text-primary mb-4 flex items-center gap-2 border-b border-primary/20 pb-2">
              <BookOpen className="w-5 h-5" /> Algoritmos e Complexidades
            </h3>

            <div className="flex flex-col gap-4 text-sm font-medium text-muted-foreground">
              <div>
                <strong className="text-foreground">
                  Busca via Índice (B-Tree / Bitmap)
                </strong>
                <p className="text-xs mt-1 leading-relaxed">
                  Usado em{" "}
                  <span className="font-mono text-primary font-bold">
                    Agente
                  </span>{" "}
                  e{" "}
                  <span className="font-mono text-primary font-bold">Caso</span>
                  . Acessa o índice logarítmico e recupera os dados resultantes.
                  <br />
                  <span className="text-destructive font-bold mt-1 inline-block">
                    <MathInline expression="Custo: O(\log N + k)" />
                  </span>{" "}
                  onde <MathInline expression="k" /> são os registros
                  encontrados.
                </p>
              </div>

              <div>
                <strong className="text-foreground">
                  Laço Aninhado com Busca (Indexed Nested Loop)
                </strong>
                <p className="text-xs mt-1 leading-relaxed">
                  Usado no join de{" "}
                  <span className="font-mono text-primary font-bold">
                    Ocasiona
                  </span>
                  . Como <MathInline expression="k_A" /> é minúsculo
                  (&#34;protozoários&#34;), ele usa a chave estrangeira para
                  achar correspondências rapidamente sem scan.
                  <br />
                  <span className="text-destructive font-bold mt-1 inline-block">
                    <MathInline expression="Custo: O(k_A \log|O| + K_{AO})" />
                  </span>
                </p>
              </div>

              <div>
                <strong className="text-foreground">Hash Join</strong>
                <p className="text-xs mt-1 leading-relaxed">
                  Usado no join final. Constrói uma tabela hash em memória com o
                  menor conjunto (<MathInline expression="K_{AO}" /> ou{" "}
                  <MathInline expression="k'_c" />) e varre o outro. Ideal para
                  resultados intermediários não ordenados.
                  <br />
                  <span className="text-destructive font-bold mt-1 inline-block">
                    <MathInline expression="Custo: O(K_{AO} + k'_c)" />
                  </span>
                </p>
              </div>

              <div>
                <strong className="text-foreground">Hash Aggregation</strong>
                <p className="text-xs mt-1 leading-relaxed">
                  Usado no{" "}
                  <span className="font-mono text-primary font-bold">
                    GROUP BY
                  </span>
                  . Agrupa os casos contando-os através de um bucket hash em
                  memória.
                  <br />
                  <span className="text-destructive font-bold mt-1 inline-block">
                    <MathInline expression="Custo: O(k)" />
                  </span>
                </p>
              </div>

              <div className="mt-2 pt-3 border-t border-border/50">
                <span className="text-xs font-bold text-foreground">
                  Símbolos de Cardinalidade:
                </span>
                <ul className="text-[11px] mt-1 grid grid-cols-2 gap-y-2 text-destructive">
                  <li>
                    <MathInline expression="k_A" /> = qtd de protozoários
                  </li>
                  <li>
                    <MathInline expression="k_c" /> = qtd de casos SC/Óbito
                  </li>
                  <li>
                    <MathInline expression="K_{AO}" /> = junção inicial
                  </li>
                  <li>
                    <MathInline expression="k" /> = grupos resultantes
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
