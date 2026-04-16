"use client";

import React, { useCallback } from "react";
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
  EdgeLabelRenderer,
  getSmoothStepPath,
  MarkerType,
  Panel,
  Node,
  Edge,
} from "@xyflow/react";
import { Key, Database, Link as LinkIcon } from "lucide-react";

/* ==============================================================================
   1. CUSTOM NODES (Tabelas, Operadores e Esquema)
   ============================================================================== */

// Nó 1: Esquema de Banco de Dados (Lateral Esquerda com Conectores por Linha)
const SchemaNode = ({ data }: NodeProps) => {
  const columns = data.columns as Array<{
    name: string;
    type: string;
    isPk?: boolean;
    isFk?: boolean;
  }>;

  return (
    // Sem overflow-hidden aqui, senão os handles das bordas são cortados
    <div className="w-64 bg-card border border-border rounded-lg shadow-sm flex flex-col text-sm font-sans">
      <div className="bg-muted/40 px-3 py-2 font-bold border-b border-border flex justify-between items-center rounded-t-lg">
        <span className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          {data.label as string}
        </span>
        <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">
          Tabela
        </span>
      </div>
      <div className="flex flex-col p-1 bg-background rounded-b-lg">
        {columns.map((c) => (
          <div
            key={c.name}
            className="relative flex justify-between items-center px-2 py-2 border-b last:border-0 border-border/40 hover:bg-muted/20 transition-colors"
          >
            {/* HANDLE ESQUERDO: Recebe conexões se for Primary Key */}
            {c.isPk && (
              <Handle
                type="target"
                position={Position.Left}
                id={`pk-${c.name}`}
                className="!w-2.5 !h-2.5 !bg-amber-500 border-2 border-background !-left-1.5"
              />
            )}

            <span className="font-mono text-[11px] flex items-center gap-1.5 text-foreground">
              {c.isPk && <Key className="w-3 h-3 text-amber-500" />}
              {!c.isPk && c.isFk && (
                <LinkIcon className="w-3 h-3 text-muted-foreground" />
              )}
              <span className={c.isPk ? "font-bold" : ""}>{c.name}</span>
              {c.isFk && (
                <span className="text-[9px] text-muted-foreground italic ml-1">
                  (fk)
                </span>
              )}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {c.type}
            </span>

            {/* HANDLE DIREITO: Emite conexão se for Foreign Key */}
            {c.isFk && (
              <Handle
                type="source"
                position={Position.Right}
                id={`fk-${c.name}`}
                className="!w-2.5 !h-2.5 !bg-muted-foreground border-2 border-background !-right-1.5"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Nó 2: Operações Relacionais (Pi, Sigma, Join)
const RelationalNode = ({ data }: NodeProps) => {
  return (
    <div className="min-w-[190px] px-4 py-2 bg-background border-2 border-primary/40 text-foreground font-mono rounded-lg shadow-md flex items-center justify-center gap-3">
      {/* ENVIA dados para cima */}
      <Handle type="source" position={Position.Top} className="opacity-0" />

      <span className="text-primary font-bold text-xl">
        {data.symbol as string}
      </span>
      <span className="text-xs font-semibold whitespace-nowrap">
        {data.label as string}
      </span>

      {/* RECEBE dados de baixo */}
      <Handle type="target" position={Position.Bottom} className="opacity-0" />
    </div>
  );
};

// Nó 3: Tabela Folha da Árvore de Execução
const LeafNode = ({ data }: NodeProps) => {
  return (
    <div className="w-14 h-14 bg-blue-600 text-white font-bold text-xl rounded-full shadow-lg flex items-center justify-center border-4 border-background ring-2 ring-blue-600/40">
      {/* TABELA SÓ ENVIA DADOS PARA CIMA */}
      <Handle type="source" position={Position.Top} className="opacity-0" />
      {data.label as string}
    </div>
  );
};

/* ==============================================================================
   2. CUSTOM EDGES (Com Anotações de Custo)
   ============================================================================== */

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
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan text-[11px] font-mono text-destructive bg-background/95 px-2 py-1 rounded border border-destructive/20 shadow-sm whitespace-pre text-center z-50"
          >
            {data.label as string}
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

const edgeTypes = {
  annotated: AnnotatedEdge,
};

/* ==============================================================================
   3. DADOS INICIAIS (Nós e Arestas)
   ============================================================================== */

const initialNodes: Node[] = [
  // --- PAINEL LATERAL: ESQUEMA DO BANCO (Mais espaçado) ---
  {
    id: "s1",
    type: "schema",
    position: { x: 50, y: 50 },
    data: {
      label: "Aluno",
      columns: [
        { name: "idA", type: "INT", isPk: true },
        { name: "nome", type: "VARCHAR" },
        { name: "dtNasc", type: "DATE" },
        { name: "IAA", type: "NUMERIC" },
      ],
    },
  },
  {
    id: "s2",
    type: "schema",
    position: { x: 50, y: 260 },
    data: {
      label: "Matrícula",
      columns: [
        { name: "idA", type: "INT", isPk: true, isFk: true },
        { name: "idT", type: "INT", isPk: true, isFk: true },
        { name: "nota", type: "NUMERIC" },
      ],
    },
  },
  {
    id: "s3",
    type: "schema",
    position: { x: 50, y: 450 },
    data: {
      label: "Turma",
      columns: [
        { name: "idT", type: "INT", isPk: true },
        { name: "ano", type: "INT" },
        { name: "idD", type: "INT", isFk: true },
      ],
    },
  },
  {
    id: "s4",
    type: "schema",
    position: { x: 50, y: 620 },
    data: {
      label: "Disciplina",
      columns: [
        { name: "idD", type: "INT", isPk: true },
        { name: "sigla", type: "VARCHAR" },
      ],
    },
  },
  {
    id: "s5",
    type: "schema",
    position: { x: 50, y: 760 },
    data: {
      label: "Leciona",
      columns: [
        { name: "idP", type: "INT", isPk: true, isFk: true },
        { name: "idT", type: "INT", isPk: true, isFk: true },
      ],
    },
  },
  {
    id: "s6",
    type: "schema",
    position: { x: 50, y: 910 },
    data: {
      label: "Professor",
      columns: [
        { name: "idP", type: "INT", isPk: true },
        { name: "apelido", type: "VARCHAR" },
      ],
    },
  },

  // --- ÁRVORE DE CONSULTA (FÍSICA) ---
  // Topo (Movido para X: 850 para não encavalar com o esquema)
  {
    id: "pi",
    type: "operator",
    position: { x: 850, y: 50 },
    data: { symbol: "π", label: "A.IDA, A.NOME, A.DT_NASC" },
  },
  {
    id: "sig1",
    type: "operator",
    position: { x: 850, y: 150 },
    data: { symbol: "σ", label: "A.DT_NASC > '31/12/1990'" },
  },
  {
    id: "sig2",
    type: "operator",
    position: { x: 850, y: 250 },
    data: { symbol: "σ", label: "A.IAA > 7" },
  },

  // Join Raiz
  {
    id: "joinA",
    type: "operator",
    position: { x: 850, y: 350 },
    data: { symbol: "⨝", label: "MT.IDA = A.IDA" },
  },

  // Ramo Direito Direto (Tabela A)
  {
    id: "nodeA",
    type: "leaf",
    position: { x: 1100, y: 450 },
    data: { label: "A" },
  },

  // Ramo Esquerdo do Join Raiz
  {
    id: "joinMT",
    type: "operator",
    position: { x: 650, y: 450 },
    data: { symbol: "⨝", label: "T.IDT = MT.IDT" },
  },
  {
    id: "nodeMT",
    type: "leaf",
    position: { x: 850, y: 550 },
    data: { label: "MT" },
  },

  // Ramo Esquerdo de MT
  {
    id: "joinLT",
    type: "operator",
    position: { x: 450, y: 550 },
    data: { symbol: "⨝", label: "L.IDT = T.IDT" },
  },

  // Desdobramento L.IDT = T.IDT
  {
    id: "joinP",
    type: "operator",
    position: { x: 250, y: 650 },
    data: { symbol: "⨝", label: "L.IDP = P.IDP" },
  },
  {
    id: "sigT",
    type: "operator",
    position: { x: 650, y: 650 },
    data: { symbol: "σ", label: "T.ANO > 2010" },
  },

  // Ramo de P & L
  {
    id: "sigP",
    type: "operator",
    position: { x: 150, y: 750 },
    data: { symbol: "σ", label: "P.APELIDO = 'FILETO'" },
  },
  {
    id: "nodeL",
    type: "leaf",
    position: { x: 380, y: 750 },
    data: { label: "L" },
  },
  {
    id: "nodeP",
    type: "leaf",
    position: { x: 210, y: 850 },
    data: { label: "P" },
  },

  // Ramo de T & D
  {
    id: "joinD",
    type: "operator",
    position: { x: 550, y: 750 },
    data: { symbol: "⨝", label: "T.IDD = D.IDD" },
  },
  {
    id: "sigD",
    type: "operator",
    position: { x: 450, y: 850 },
    data: { symbol: "σ", label: "D.SIGLA = 'INE5616'" },
  },
  {
    id: "nodeT",
    type: "leaf",
    position: { x: 700, y: 850 },
    data: { label: "T" },
  },
  {
    id: "nodeD",
    type: "leaf",
    position: { x: 510, y: 950 },
    data: { label: "D" },
  },
];

// Estilo Base para Setas da Árvore (Fluxo de Dados: De baixo para Cima)
const treeEdgeOptions = {
  type: "annotated",
  markerEnd: { type: MarkerType.ArrowClosed, color: "var(--color-primary)" },
  style: { strokeWidth: 2, stroke: "var(--color-primary)" },
};

// Estilo Base para Setas do Esquema (FK -> PK)
const schemaEdgeOptions = {
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

const initialEdges: Edge[] = [
  /* --- ARESTAS DO ESQUEMA (FK -> PK usando os Handles Dinâmicos) --- */
  {
    id: "fk1",
    source: "s2",
    sourceHandle: "fk-idA",
    target: "s1",
    targetHandle: "pk-idA",
    ...schemaEdgeOptions,
  },
  {
    id: "fk2",
    source: "s2",
    sourceHandle: "fk-idT",
    target: "s3",
    targetHandle: "pk-idT",
    ...schemaEdgeOptions,
  },
  {
    id: "fk3",
    source: "s3",
    sourceHandle: "fk-idD",
    target: "s4",
    targetHandle: "pk-idD",
    ...schemaEdgeOptions,
  },
  {
    id: "fk4",
    source: "s5",
    sourceHandle: "fk-idT",
    target: "s3",
    targetHandle: "pk-idT",
    ...schemaEdgeOptions,
  },
  {
    id: "fk5",
    source: "s5",
    sourceHandle: "fk-idP",
    target: "s6",
    targetHandle: "pk-idP",
    ...schemaEdgeOptions,
  },

  /* --- ARESTAS DA ÁRVORE (Fluxo de Dados = De Baixo Para Cima) --- */
  // Pipeline linear
  { id: "e1", source: "sig1", target: "pi", ...treeEdgeOptions },
  { id: "e2", source: "sig2", target: "sig1", ...treeEdgeOptions },
  { id: "e3", source: "joinA", target: "sig2", ...treeEdgeOptions },

  // Join Raiz (A.IDA = MT.IDA)
  {
    id: "e4",
    source: "nodeA",
    target: "joinA",
    ...treeEdgeOptions,
  },
  {
    id: "e5",
    source: "joinMT",
    target: "joinA",
    ...treeEdgeOptions,
  },

  // Join MT
  { id: "e6", source: "nodeMT", target: "joinMT", ...treeEdgeOptions },
  { id: "e7", source: "joinLT", target: "joinMT", ...treeEdgeOptions },

  // Join L e T
  { id: "e8", source: "joinP", target: "joinLT", ...treeEdgeOptions },
  { id: "e9", source: "sigT", target: "joinLT", ...treeEdgeOptions },

  // Ramo Professor
  { id: "e10", source: "sigP", target: "joinP", ...treeEdgeOptions },
  { id: "e11", source: "nodeL", target: "joinP", ...treeEdgeOptions },
  { id: "e12", source: "nodeP", target: "sigP", ...treeEdgeOptions },

  // Ramo Turma/Disciplina
  { id: "e13", source: "joinD", target: "sigT", ...treeEdgeOptions },
  { id: "e14", source: "sigD", target: "joinD", ...treeEdgeOptions },
  { id: "e15", source: "nodeT", target: "joinD", ...treeEdgeOptions },
  { id: "e16", source: "nodeD", target: "sigD", ...treeEdgeOptions },
];

/* ==============================================================================
   4. COMPONENTE PRINCIPAL DA PÁGINA
   ============================================================================== */

export default function QueryOptimizerPage() {
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

          <Controls className="bg-background border-border fill-foreground" />
        </ReactFlow>
      </div>
    </div>
  );
}
