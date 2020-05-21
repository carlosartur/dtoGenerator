const fs = require('fs');

String.prototype.firstToUpperCase = function () {
    return this.charAt(0).toUpperCase() + this.slice(1)
}

const jsDto = (config = null) => {
    try {
        var obj = config.obj;
        var name = config.name;
        var camelCase = config.camelCase;
        var generateGettersAndSetters = config.generateGettersAndSetters;
        var props = [],
            gettersAndSetters = [];
            defaults = {
                'Number': '0',
                'Array': '[]',
                'String': "''",
                'Boolean': 'false',
                'Object': '{}',
                'null': 'null',
                'any': 'null',
            },
            internalObjects = [];

        for (var i in obj) {
            var type = obj[i] === null ? 'any' : obj[i].constructor.name,
                paramName = camelCase ? snakeToCamel(i) : i;
            props.push(`
                /**
                 * @var {${type}} ${ paramName }
                 */ 
                ${ paramName } = ${(defaults[type] || defaults['null'])};`);

            if (type === 'Object') {
                internalObjects.push({
                    obj: obj[i],
                    name: i,
                    camelCase,
                    generateGettersAndSetters
                });
            }

            if (type === 'Array') {
                let objectOfArray = obj[i].pop();
                if (objectOfArray && objectOfArray.constructor.name === 'Object') {
                    internalObjects.push({
                        obj: objectOfArray,
                        name: i,
                        camelCase,
                        generateGettersAndSetters
                    });
                }
            }

            if (!generateGettersAndSetters) {
                continue;
            }

            var typeVerification = defaults[type] && defaults[type] !== 'null' && defaults[type] !== 'any'
                ? `if (value.constructor.name !== "${ type }") {
                    throw new TypeError("${ paramName } must be a ${ type }. " + value.constructor.name + " given");
                }` 
                : '';
            
            if (type === 'Object') {
                type = `${ paramName.firstToUpperCase() }Dto`;
                typeVerification = `if (value.constructor.name !== "${type}") {
                    throw new TypeError("${ paramName } must be a ${ type }. " + value.constructor.name + " given");
                }` 
            }
            
            gettersAndSetters.push(`/**
                 * Setter for attribute ${ paramName }
                 * @param {${ type }} value
                 * @return this
                 */
                set${ paramName.firstToUpperCase() }(value) {
                    ${ typeVerification }
                    this.${ paramName } = value;
                    return this;
                }

                /**
                 * Getter for attribute ${ paramName }
                 * @return {${ type }}
                 */
                get${ paramName.firstToUpperCase() }() {
                    return this.${paramName};
                }`);

            if (type === 'Array') {
                gettersAndSetters.push(`/**
                    * Add on attribute ${paramName}
                    * @param {${ type }} value
                    * @return this
                    */
                    add${ paramName.firstToUpperCase() }(value) {
                        this.${ paramName }.push(value);
                        return this;
                    }`);
            }
        }

        var ret = `
            const AbstractDto = require('./AbstractDto');

            module.exports = class ${ name.firstToUpperCase() }Dto extends AbstractDto {
                ${props.join('\n')}
                
                ${gettersAndSetters.join('\n')}
            }
            `;
        fs.writeFile(`./dtos/${ name.firstToUpperCase() }.js`, ret, err => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(`${ name.firstToUpperCase() }Dto class generated`);
        });
        internalObjects.forEach(config => jsDto(config));
        return ret;
    } catch (e) {
        return e;
    }
};

const phpDto = (config = null) => {
    try {
        var obj = config.obj,
            name = config.name,
            camelCase = config.camelCase, 
            generateGettersAndSetters = config.generateGettersAndSetters,
            namespace = config.namespace;

        var props = [],
            gettersAndSetters = [];
            defaults = {
                'Number': '0',
                'Array': '[]',
                'String': "''",
                'Boolean': 'false',
                'Object': 'null',
                'null': 'null',
                'any': 'null',
            }, types = {
                'Number': 'float',
                'Array': 'array',
                'String': "string",
                'Boolean': 'boolean',
                'Object': 'Object',
                'null': 'mixed',
                'any': 'mixed',
            },
            internalObjects = [];

        for (var i in obj) {
            var type = obj[i] === null ? 'any' : obj[i].constructor.name,
                paramName = camelCase ? snakeToCamel(i) : i;
                            
            let typeParam = types[type] || type.toLowerCase();

            props.push(`
                /**
                 * @var ${typeParam} $${ paramName }
                 */ 
                public $${ paramName } = ${(defaults[type] || defaults['null'])};`);

            if (type === 'Object') {
                internalObjects.push({
                    obj: obj[i],
                    name: i,
                    camelCase,
                    generateGettersAndSetters,
                    namespace
                });
            }

            if (type === 'Array') {
                let objectOfArray = obj[i].pop();
                if (objectOfArray && objectOfArray.constructor.name === 'Object') {
                    internalObjects.push({
                        obj: objectOfArray,
                        name: i,
                        camelCase,
                        generateGettersAndSetters,
                        namespace
                    });
                }
            }

            if (!generateGettersAndSetters) {
                continue;
            }
        
            gettersAndSetters.push(`/**
                 * Setter for attribute $${ paramName }
                 * @param ${ typeParam } $value
                 * @return $this
                 */
                public function set${ paramName.firstToUpperCase() }($value) 
                {
                    $this->${ paramName } = $value;
                    return $this;
                }

                /**
                 * Getter for attribute $${ paramName }
                 * @return ${ type }
                 */
                public function get${ paramName.firstToUpperCase() }() 
                {
                    return $this->${paramName};
                }`);

            if (type === 'Array') {
                gettersAndSetters.push(`/**
                    * Add on attribute $${paramName}
                    * @param ${ type } value
                    * @return $this
                    */
                    public function add${ paramName.firstToUpperCase() }($value) 
                    {
                        array_push($this->${ paramName }, $value);
                        return $this;
                    }`);
            }
        }

        var ret = `<?php
            namespace ${config.namespace};    

            class ${ name.firstToUpperCase() }Dto {
                ${props.join('\n')}
                
                ${gettersAndSetters.join('\n')}
            }
            `;
        fs.writeFile(`./dtos/${ name.firstToUpperCase() }.php`, ret, err => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(`${ name.firstToUpperCase() }Dto class generated`);
        });
        internalObjects.forEach(config => phpDto(config));
        return ret;
    } catch (e) {
        throw e;
    }
};

const snakeToCamel = (str) => str.replace(
    /([-_][a-z])/g,
    (group) => group.toUpperCase()
    .replace('-', '')
    .replace('_', '')
);

fs.readFile('dto.json', 'UTF-8', (err, data) => {
    if (err) {
        console.error(err);
    }

    try {
        let obj = JSON.parse(data);
        // jsDto({
        //     obj,
        //     name: "Order",
        //     camelCase: false,
        //     generateGettersAndSetters: true,
        // });

        phpDto({
            obj,
            name: "Order",
            camelCase: false,
            generateGettersAndSetters: true,
            namespace: 'Teste\\Teste\\Dto',
        });
    } catch (err) {
        console.error(err);
    }
});
