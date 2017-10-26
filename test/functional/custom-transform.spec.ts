import "reflect-metadata";
import {expect} from "chai";
import {classToPlain, plainToClass} from "../../src/index";
import {defaultMetadataStorage} from "../../src/storage";
import {Expose, Transform, Type} from "../../src/decorators";
import * as moment from "moment";
import {TransformationType} from "../../src/TransformOperationExecutor";

describe("custom transformation decorator", () => {

    it("@Expose decorator with \"name\" option should work with @Transform decorator", () => {
        defaultMetadataStorage.clear();

        class User {

            @Expose({name: "user_name"})
            @Transform(value => value.toUpperCase())
            name: string;
        }

        let plainUser = {
            user_name: "Johny Cage"
        };

        const classedUser = plainToClass(User, plainUser);
        classedUser.name.should.be.equal("JOHNY CAGE");
    });

    it("@Transform decorator logic should be executed depend of toPlainOnly and toClassOnly set", () => {
        defaultMetadataStorage.clear();

        class User {

            id: number;

            name: string;

            @Transform(value => value.toString(), {toPlainOnly: true})
            @Transform(value => moment(value), {toClassOnly: true})
            date: Date;

        }

        let plainUser = {
            id: 1,
            name: "Johny Cage",
            date: new Date().valueOf()
        };

        const user = new User();
        user.id = 1;
        user.name = "Johny Cage";
        user.date = new Date();

        const classedUser = plainToClass(User, plainUser);
        classedUser.should.be.instanceOf(User);
        classedUser.id.should.be.equal(1);
        classedUser.name.should.be.equal("Johny Cage");
        moment.isMoment(classedUser.date).should.be.true;

        const plainedUser = classToPlain(user);
        plainedUser.should.not.be.instanceOf(User);
        plainedUser.should.be.eql({
            id: 1,
            name: "Johny Cage",
            date: user.date.toString()
        });

    });

    it("versions and groups should work with @Transform decorator too", () => {
        defaultMetadataStorage.clear();

        class User {

            id: number;

            name: string;

            @Type(() => Date)
            @Transform(value => moment(value), {since: 1, until: 2})
            date: Date;

            @Type(() => Date)
            @Transform(value => value.toString(), {groups: ["user"]})
            lastVisitDate: Date;

        }

        let plainUser = {
            id: 1,
            name: "Johny Cage",
            date: new Date().valueOf(),
            lastVisitDate: new Date().valueOf()
        };

        const classedUser1 = plainToClass(User, plainUser);
        classedUser1.should.be.instanceOf(User);
        classedUser1.id.should.be.equal(1);
        classedUser1.name.should.be.equal("Johny Cage");
        moment.isMoment(classedUser1.date).should.be.true;

        const classedUser2 = plainToClass(User, plainUser, {version: 0.5});
        classedUser2.should.be.instanceOf(User);
        classedUser2.id.should.be.equal(1);
        classedUser2.name.should.be.equal("Johny Cage");
        classedUser2.date.should.be.instanceof(Date);

        const classedUser3 = plainToClass(User, plainUser, {version: 1});
        classedUser3.should.be.instanceOf(User);
        classedUser3.id.should.be.equal(1);
        classedUser3.name.should.be.equal("Johny Cage");
        moment.isMoment(classedUser3.date).should.be.true;

        const classedUser4 = plainToClass(User, plainUser, {version: 2});
        classedUser4.should.be.instanceOf(User);
        classedUser4.id.should.be.equal(1);
        classedUser4.name.should.be.equal("Johny Cage");
        classedUser4.date.should.be.instanceof(Date);

        const classedUser5 = plainToClass(User, plainUser, {groups: ["user"]});
        classedUser5.should.be.instanceOf(User);
        classedUser5.id.should.be.equal(1);
        classedUser5.name.should.be.equal("Johny Cage");
        classedUser5.lastVisitDate.should.be.equal(new Date(plainUser.lastVisitDate).toString());
    });

    it("@Transform decorator callback should be given correct arguments", () => {
        defaultMetadataStorage.clear();

        let objArg: any;
        let typeArg: TransformationType;

        function transformCallback(value: any, obj: any, type: TransformationType) {
            objArg = obj;
            typeArg = type;
            return value;
        }

        class User {
            @Transform(transformCallback, {toPlainOnly: true})
            @Transform(transformCallback, {toClassOnly: true})
            name: string;
        }

        let plainUser = {
            name: "Johny Cage",
        };

        plainToClass(User, plainUser);
        objArg.should.be.equal(plainUser);
        typeArg.should.be.equal(TransformationType.PLAIN_TO_CLASS);

        const user = new User();
        user.name = "Johny Cage";

        classToPlain(user);
        objArg.should.be.equal(user);
        typeArg.should.be.equal(TransformationType.CLASS_TO_PLAIN);
    });
    
    let model: any;
    it ('should serialize json into model instance of class Person', () => {
        expect(() => {
            const json = {
                name: 'John Doe',
                address: {
                    street: 'Main Street 25',
                    tel: '5454-534-645',
                    zip: 10353,
                    country: 'West Samoa'
                },
                age: 25,
                hobbies: [
                    { type: 'sport', name: 'sailing' },
                    { type: 'relax', name: 'reading' },
                    { type: 'sport', name: 'jogging' },
                    { type: 'relax', name: 'movies'  }
                ]
            };
            class Hobby {
                public type: string;
                public name: string;
            }
            class Address {
                public street: string;
                
                @Expose({ name: 'tel' }) 
                public telephone: string;
                
                public zip: number;
                
                public country: string;
            }
            class Person {
                public name: string;
                
                @Type(() => Address)
                public address: Address;
                
                @Type(() => Hobby)
                @Transform(value => value.filter(hobby: any => hobby.type === 'sport'), { toClassOnly: true })
                public hobbies: Hobby[];
                
                public age: number;
            }
            model = plainToClass(Person, json);
            expect(model instanceof Person);
            expect(model.address instanceof Address);
            model.hobbies.forEach(hobby: any => expect(hobby instanceof Hobby && hobby.type === 'sport'));
        }).not.toThrowError();
    });
    
    it ('should serialize a model into json', () => {
        expect(() => {
            classToPlain(model);
        }).not.toThrowError();
    });

});
