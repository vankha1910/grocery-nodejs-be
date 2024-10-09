class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    const filteredCondition = JSON.parse(queryStr);

    let conditions = [];

    Object.keys(filteredCondition).forEach((key) => {
      if (typeof filteredCondition[key] === 'string') {
        conditions.push({
          [key]: { $regex: filteredCondition[key], $options: 'i' },
        });
      } else {
        conditions.push({ [key]: filteredCondition[key] });
      }
    });

    // Search
    if (this.queryString.search) {
      const keyword = this.queryString.search;
      const searchCondition = {
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { brand: { $regex: keyword, $options: 'i' } },
          { tags: { $regex: keyword, $options: 'i' } },
        ],
      };
      conditions.push(searchCondition);
    }
    if (conditions.length > 0) {
      this.query = this.query.find({
        $and: conditions,
      });
    } else {
      this.query = this.query.find(); // Không có điều kiện lọc, lấy tất cả
    }

    return this;
  }

  sort() {
    // console.log(this.queryString);
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      // console.log(sortBy);
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
module.exports = APIFeatures;
