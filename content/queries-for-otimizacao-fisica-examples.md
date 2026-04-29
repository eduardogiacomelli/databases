### Exercise Query Optimization 2 (otimizacao-fisica-2)

Code for the query is:

```SQL
SELECT A.nome, COUNT(C.*) AS NroCasos

FROM Agente A, Ocasiona O, Doenca D, Caso C

WHERE A.codag = O.codag AND O.codd = D.codd AND D.codd = C.codd AND
A.tipo = 'protozoario' AND C.data >= '26/09/2012' AND C.uf = 'SC' AND
C.situacao = 'Obito'

GROUP BY A.NOME

HAVING NroCasos > ( SELECT COUNT(*) FROM Caso / SELECT COUNT(*) FROM Agente ) ;
```

Important to explicit each algorithm used in the execution of operators
from the optimized query strategy, with their respective asymptotic
complexity in Big(O) in function of the number of records in each table
(|A|, |O|, |C|, |D|).
Assume there is primary index and auxiliary indexes for all foreign keys
in each table, as well as indexes for 'Agente.tipo',
'Caso.data, Caso.uf, Caso.situacao'.
Assume historical data since 1911 and MUCH BETTER SELECTIVITY IN Agente
for 'tipo' 'protozoario' than in casos resulting in 'Caso.situacao = obito'
in 'Caso.uf = SC' since 'Caso.data >= 26/09/2012'.

### Exercise Query optimization 3 (otimizacao-fisica-3)

Indique algoritmo(s) eficiente(s) para executar a estratégia apresentada e a sua complexidade assintótica, em termos do número de acessos a disco, função do número de registros nas tabelas (|A|, |M|, |P| e |D|). Considere dados desde 2001, milhões de pacientes e atestados, milhares de médicos e doenças e cada tabela com índice primário pelo respectivo código, além de índice auxiliar por cada outro atributo mencionado na consulta.

```SQL

SELECT M.CRM, M.nome, COUNT(A.*) AS nAtests, COUNT(DISTINCT P.codP)

FROM Atestado A, Médico M, Paciente P, Doença D

WHERE A.CRM = M.CRM AND A.codP = P.codP AND A.codD = D.codD AND

             A.ESTADO=M.ESTADO AND A.data >= '01/01/12' AND D.espec <> M.espec AND

             M.estado = 'SC' AND P.estado = 'SC'

GROUP BY M.CRM, M.nome

HAVING nAtests > (SELECT COUNT(*) / COUNT(DISTINCT CRM) FROM Atestado)

ORDER BY nAtests DESCENDING;

```

### Exercise query optimization 4 (otimizacao-fisica-4)

Apresente a árvore de consulta otimizada para a expressão em SQL abaixo. Considere:

País.nome chave candidata;
bem menos emigrações do Brasil em toda a história mantida no banco de dados do que emigrações de quaisquer outras partes do mundo desde '01/01/2020';
bem menos indívíduos emigrando do Brasil desde '01/01/2020' do que nascidos em todo o mundo desde '01/01/2000;
muitas imigrações para certos países;
índice primário para cada tabela (pelo respectivo campo id), índice secundário por cada chave estrangeira, I.dtNasc,M.dtMigra e Pais.nome.
Indique algoritmos eficientes para executar (grupos de) operadores da estratégia proposta, em termos do número de tuplas em cada tabela (|Pais|, |M| e |I|) e dos tamanhos dos resultados de cada um desses algoritmos.

```SQL
SELECT  PD.*,  COUNT (M.*) AS n

FROM  Individuo I INNER JOIN Migra M on I.idI = M.idI INNER JOIN Pais PO ON  M.idPO = PO.idP INNER JOIN Pais AS PD ON M.idPD = PD.idP

WHERE  I.dtNasc >= '01/01/2000'  AND  M.dtMigra >= '01/01/2020'  AND  PO.nome = 'Brasil'

GROUP BY   PD.*     HAVING n > 10000      ORDER BY n DESCENDING ;
```
