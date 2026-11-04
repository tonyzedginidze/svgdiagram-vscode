function validateGeneCount(geneCount) {
  if (geneCount !== 1 && geneCount !== 2) {
    throw new Error("Gene count must be 1 or 2.");
  }
}

function compareAllelePairs(left, right) {
  const rank = (pair) => pair[0] === pair[1] ? (pair[0] === pair[0].toUpperCase() ? 0 : 2) : 1;
  return rank(left) - rank(right) || left.localeCompare(right);
}

export function parsePunnettParent(value, geneCount) {
  validateGeneCount(geneCount);
  if (typeof value !== "string") {
    throw new Error("Parent genotype must be text containing allele pairs.");
  }

  const genotype = value.replace(/\s/g, "");
  if (!/^[A-Za-z]+$/.test(genotype)) {
    throw new Error("Genotype may contain only ASCII letters and whitespace.");
  }
  if (genotype.length !== geneCount * 2) {
    throw new Error(`Genotype must contain exactly ${geneCount} allele pair${geneCount === 1 ? "" : "s"}.`);
  }

  const pairs = [];
  for (let index = 0; index < genotype.length; index += 2) {
    const first = genotype[index];
    const second = genotype[index + 1];
    if (first.toLowerCase() !== second.toLowerCase()) {
      throw new Error(`Alleles ${first} and ${second} in a pair must be the same letter, ignoring case.`);
    }

    const symbol = first.toUpperCase();
    const pair = [first, second].sort((left, right) => {
      if (left === right) return 0;
      return left === symbol ? -1 : 1;
    }).join("");
    if (pairs.some((locus) => locus.symbol === symbol)) {
      throw new Error(`Each locus must use a distinct letter; ${symbol} appears more than once.`);
    }
    pairs.push({ symbol, pair });
  }

  pairs.sort((left, right) => left.symbol.localeCompare(right.symbol));
  return {
    genotype: pairs.map(({ pair }) => pair).join(""),
    loci: pairs.map(({ symbol, pair }) => ({ symbol, alleles: [...pair] })),
  };
}

function gametesFor(parent) {
  const outcomes = new Map();
  const build = (index, label, weight, denominator) => {
    if (index === parent.loci.length) {
      outcomes.set(label, (outcomes.get(label) || 0) + weight / denominator);
      return;
    }

    const alleles = parent.loci[index].alleles;
    const choices = alleles[0] === alleles[1] ? [[alleles[0], 1]] : [[alleles[0], 1], [alleles[1], 1]];
    for (const [allele, choiceWeight] of choices) {
      build(index + 1, label + allele, weight * choiceWeight, denominator * (choices.length === 1 ? 1 : 2));
    }
  };
  build(0, "", 1, 1);
  return [...outcomes].sort(([left], [right]) => {
    for (let index = 0; index < left.length; index += 1) {
      if (left[index] !== right[index]) return left[index] === left[index].toUpperCase() ? -1 : 1;
    }
    return 0;
  }).map(([label, probability]) => ({ label, probability }));
}

function canonicalPair(first, second) {
  const upper = first.toUpperCase();
  return first === second ? first + second : first === upper ? first + second : second + first;
}

function compareLabeledGenotypes(left, right, geneCount) {
  for (let index = 0; index < geneCount; index += 1) {
    const leftPair = left.slice(index * 2, index * 2 + 2);
    const rightPair = right.slice(index * 2, index * 2 + 2);
    const order = compareAllelePairs(leftPair, rightPair);
    if (order) return order;
  }
  return 0;
}

function reducedRatio(probabilities) {
  const counts = probabilities.map((probability) => probability * 16);
  const gcd = (left, right) => right ? gcd(right, left % right) : left;
  const divisor = counts.reduce((result, count) => gcd(result, count), 0);
  return counts.map((count) => count / divisor).join(":");
}

export function calculatePunnett({ geneCount, parent1, parent2 }) {
  validateGeneCount(geneCount);
  const parsed1 = parsePunnettParent(parent1, geneCount);
  const parsed2 = parsePunnettParent(parent2, geneCount);
  const loci = parsed1.loci.map(({ symbol }) => symbol);
  if (loci.some((symbol, index) => symbol !== parsed2.loci[index].symbol)) {
    throw new Error("Both parents must have the same locus letters.");
  }

  const gametes1 = gametesFor(parsed1);
  const gametes2 = gametesFor(parsed2);
  const cells = gametes1.flatMap((row, rowIndex) => gametes2.map((column, columnIndex) => {
    const genotype = loci.map((_, index) => canonicalPair(row.label[index], column.label[index])).join("");
    const phenotype = loci.map((_, index) => {
      const pair = genotype.slice(index * 2, index * 2 + 2);
      return pair[0] === pair[0].toUpperCase() ? `${pair[0]}_` : pair;
    }).join("");
    return { row: rowIndex, column: columnIndex, genotype, phenotype, probability: row.probability * column.probability };
  }));

  const summarize = (field, compare) => {
    const totals = new Map();
    for (const cell of cells) totals.set(cell[field], (totals.get(cell[field]) || 0) + cell.probability);
    return [...totals].sort(([left], [right]) => compare(left, right)).map(([label, probability]) => ({ label, probability }));
  };
  const genotypes = summarize("genotype", (left, right) => compareLabeledGenotypes(left, right, geneCount));
  const phenotypes = summarize("phenotype", (left, right) => {
    for (let index = 0; index < geneCount; index += 1) {
      const leftPart = left.slice(index * 2, index * 2 + 2);
      const rightPart = right.slice(index * 2, index * 2 + 2);
      if (leftPart !== rightPart) return leftPart[0] === leftPart[0].toUpperCase() ? -1 : 1;
    }
    return 0;
  });

  return {
    geneCount,
    parent1: parsed1.genotype,
    parent2: parsed2.genotype,
    loci,
    gametes1,
    gametes2,
    cells,
    genotypes,
    phenotypes,
    genotypeRatio: reducedRatio(genotypes.map(({ probability }) => probability)),
    phenotypeRatio: reducedRatio(phenotypes.map(({ probability }) => probability)),
  };
}
