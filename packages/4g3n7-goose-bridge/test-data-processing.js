/**
 * Simple test script for Phase 3.2 Data Processing functionality
 */

const { DataTransformerService } = require('./dist/services/data-transformer.service');
const { DataValidatorService } = require('./dist/services/data-validator.service');

async function testDataProcessing() {
  console.log('🧪 Testing Phase 3.2 Data Processing...\n');

  // Initialize services
  const transformer = new DataTransformerService();
  const validator = new DataValidatorService();

  try {
    // Test 1: JSON to CSV conversion
    console.log('📊 Test 1: JSON to CSV conversion');
    const testData = [
      { name: 'John', age: 30, city: 'New York' },
      { name: 'Jane', age: 25, city: 'London' },
      { name: 'Bob', age: 35, city: 'Tokyo' }
    ];

    const csvResult = await transformer.jsonToCsv(testData);
    console.log('✅ JSON to CSV result:');
    console.log(csvResult);
    console.log();

    // Test 2: CSV to JSON conversion
    console.log('📊 Test 2: CSV to JSON conversion');
    const jsonResult = await transformer.csvToJson(csvResult);
    console.log('✅ CSV to JSON result:');
    console.log(JSON.stringify(jsonResult, null, 2));
    console.log();

    // Test 3: Data validation
    console.log('📊 Test 3: Data validation');
    const schema = {
      id: 'user',
      name: 'User Schema',
      version: '1.0.0',
      fields: [
        {
          field: 'name',
          type: 'required' as const
        },
        {
          field: 'age',
          type: 'type' as const,
          config: { expectedType: 'number' }
        },
        {
          field: 'email',
          type: 'email' as const
        }
      ]
    };

    const validData = { name: 'Alice', age: 28, email: 'alice@example.com' };
    const invalidData = { name: '', age: 'not-a-number', email: 'invalid-email' };

    const validResult = await validator.validate(validData, schema);
    const invalidResult = await validator.validate(invalidData, schema);

    console.log('✅ Valid data validation:');
    console.log(`Valid: ${validResult.valid}, Errors: ${validResult.errors.length}`);
    console.log();

    console.log('✅ Invalid data validation:');
    console.log(`Valid: ${invalidResult.valid}, Errors: ${invalidResult.errors.length}`);
    invalidResult.errors.forEach(error => {
      console.log(`  - ${error.field}: ${error.message}`);
    });
    console.log();

    // Test 4: Full transformation pipeline
    console.log('📊 Test 4: Full transformation pipeline');
    const xmlData = `<users>
      <user>
        <name>Charlie</name>
        <age>40</age>
        <department>Engineering</department>
      </user>
      <user>
        <name>Diana</name>
        <age>32</age>
        <department>Marketing</department>
      </user>
    </users>`;

    const jsonFromXml = await transformer.xmlToJson(xmlData);
    console.log('✅ XML to JSON:');
    console.log(JSON.stringify(jsonFromXml, null, 2));

    const csvFromJson = await transformer.jsonToCsv(jsonFromXml.users.user);
    console.log('✅ JSON to CSV:');
    console.log(csvFromJson);

    console.log('\n🎉 All Phase 3.2 Data Processing tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDataProcessing();
