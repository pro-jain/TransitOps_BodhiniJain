import { prisma } from '../prisma/client.js';

const relationMappings = {
  Trip: { vehicleId: 'vehicle', driverId: 'driver', createdById: 'createdBy' },
  MaintenanceLog: { vehicleId: 'vehicle' },
  FuelLog: { vehicleId: 'vehicle', tripId: 'trip' },
  Expense: { vehicleId: 'vehicle' },
};

const modelMap = {
  User: prisma.user,
  Vehicle: prisma.vehicle,
  Driver: prisma.driver,
  Trip: prisma.trip,
  MaintenanceLog: prisma.maintenanceLog,
  FuelLog: prisma.fuelLog,
  Expense: prisma.expense,
};

function normalizeFilter(filter) {
  if (!filter) return undefined;
  const where = {};
  for (const [key, value] of Object.entries(filter)) {
    if (key === '_id') {
      where.id = value;
      continue;
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      where[key] = normalizeCondition(value);
      continue;
    }
    where[key] = value;
  }
  return where;
}

function normalizeCondition(condition) {
  const normalized = {};
  for (const [op, value] of Object.entries(condition)) {
    if (op === '$ne') normalized.not = value;
    else if (op === '$in') normalized.in = value;
    else if (op === '$nin') normalized.not = { in: value };
    else if (op === '$gte') normalized.gte = value;
    else if (op === '$lte') normalized.lte = value;
    else if (op === '$gt') normalized.gt = value;
    else if (op === '$lt') normalized.lt = value;
    else normalized[op] = value;
  }
  return normalized;
}

function normalizeSort(sort) {
  if (!sort) return undefined;
  const orderBy = [];
  for (const [key, value] of Object.entries(sort)) {
    const direction = value === -1 ? 'desc' : 'asc';
    orderBy.push({ [key]: direction });
  }
  return orderBy.length === 1 ? orderBy[0] : orderBy;
}

function parsePopulateFields(fields) {
  if (!fields) return true;
  const select = {};
  for (const part of String(fields).split(' ').filter(Boolean)) {
    select[part] = true;
  }
  return { select };
}

function normalizeResult(result) {
  if (Array.isArray(result)) return result.map(normalizeResult);
  if (!result || typeof result !== 'object') return result;

  const output = { ...result, _id: result.id };
  for (const [key, value] of Object.entries(output)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      output[key] = normalizeResult(value);
    }
  }
  return output;
}

function mapRelationIncludes(modelName, include, result) {
  const mappings = relationMappings[modelName] || {};
  if (!mappings) return normalizeResult(result);
  if (Array.isArray(result)) {
    return result.map((row) => mapRelationIncludes(modelName, include, row));
  }
  const output = { ...result };
  for (const [localKey, relationName] of Object.entries(mappings)) {
    if (output[relationName] !== undefined) {
      output[localKey] = output[relationName];
      delete output[relationName];
    }
  }
  return normalizeResult(output);
}

class PrismaQuery {
  constructor(modelName, queryType, filter) {
    this.modelName = modelName;
    this.queryType = queryType;
    this.filter = normalizeFilter(filter);
    this.include = {};
    this.orderBy = undefined;
  }

  populate(path, fields) {
    const modelRelations = relationMappings[this.modelName] || {};
    const relationName = modelRelations[path] || path.replace(/Id$/, '');
    const includeValue = parsePopulateFields(fields);
    this.include[relationName] = includeValue;
    return this;
  }

  sort(sortObj) {
    this.orderBy = normalizeSort(sortObj);
    return this;
  }

  lean() {
    return this;
  }

  async countDocuments() {
    const model = modelMap[this.modelName];
    return model.count({ where: this.filter });
  }

  async then(resolve, reject) {
    try {
      const model = modelMap[this.modelName];
      let result;
      if (this.queryType === 'findMany') {
        result = await model.findMany({ where: this.filter, include: this.include, orderBy: this.orderBy });
      } else if (this.queryType === 'findFirst') {
        result = await model.findFirst({ where: this.filter, include: this.include, orderBy: this.orderBy });
      } else if (this.queryType === 'findUnique') {
        result = await model.findUnique({ where: { id: this.filter.id }, include: this.include });
      } else {
        throw new Error(`Unsupported query type: ${this.queryType}`);
      }
      resolve(normalizeResult(mapRelationIncludes(this.modelName, this.include, result)));
    } catch (err) {
      reject(err);
    }
  }
}

export function createModel(modelName) {
  const model = modelMap[modelName];
  if (!model) throw new Error(`Unknown Prisma model: ${modelName}`);

  return {
    find(filter = {}) {
      return new PrismaQuery(modelName, 'findMany', filter);
    },
    findOne(filter = {}) {
      return new PrismaQuery(modelName, 'findFirst', filter);
    },
    findById(id) {
      return new PrismaQuery(modelName, 'findUnique', { id });
    },
    async create(data) {
      return normalizeResult(await model.create({ data }));
    },
    async findByIdAndUpdate(id, data, options = {}) {
      try {
        return normalizeResult(await model.update({ where: { id }, data }));
      } catch (err) {
        if (err?.code === 'P2025') return null;
        throw err;
      }
    },
    async findByIdAndDelete(id) {
      try {
        return normalizeResult(await model.delete({ where: { id } }));
      } catch (err) {
        if (err?.code === 'P2025') return null;
        throw err;
      }
    },
    async findOneAndUpdate(filter, data) {
      try {
        return normalizeResult(await model.update({ where: normalizeFilter(filter), data }));
      } catch (err) {
        if (err?.code === 'P2025') return null;
        throw err;
      }
    },
    async distinct(field, filter = {}) {
      const rows = await model.findMany({ where: normalizeFilter(filter), select: { [field]: true } });
      const values = rows.map((row) => row[field]);
      return Array.from(new Set(values));
    },
    async countDocuments(filter = {}) {
      return model.count({ where: normalizeFilter(filter) });
    },
  };
}
