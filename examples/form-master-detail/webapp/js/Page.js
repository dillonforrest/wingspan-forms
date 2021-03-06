/** @jsx React.DOM */
define([
    'underscore', 'react', 'wingspan-forms', 'util',
    'text!textassets/types/Contact.json',
    'text!textassets/contacts.json'
], function (_, React, Forms, util,
             ContactModel, contacts) {
    'use strict';

    var ContactModel = JSON.parse(ContactModel).data;
    var contacts = JSON.parse(contacts).data;


    var App = React.createClass({
        mixins: [Forms.TopStateMixin],

        getInitialState: function () {
            return {
                collection: contacts, // source of truth/database state
                MasterDetail: {
                    formValue: {}
                }
            };
        },

        render: function () {
            return (
                <div className="App">
                    <MasterDetail
                        model={ContactModel} collection={this.state.collection}
                        value={this.state.MasterDetail} onChange={_.partial(this.onChange, 'MasterDetail')} />
                    <button onClick={this.onFormSaveAB}>Save</button>
                    <pre>{JSON.stringify(this.state, undefined, 2)}</pre>
                </div>
            );
        },

        onFormSaveAB: function (path) {
            var record = _.findWhere(this.state.collection, { id: this.state.MasterDetail.formValue.id });
            var nextRecord = $.extend(true, {}, record, this.state.MasterDetail.formValue, { revision: this.state.MasterDetail.formValue.revision + 1 });

            // subtract out the stale record (old revision)
            // union in the new record into the nextCollection
            var nextCollection = util.differenceDeep(this.state.collection, [record]);
            nextCollection = util.unionDeep(nextCollection, [nextRecord]);

            var nextState = util.deepClone(this.state);
            nextState.collection = nextCollection;
            nextState.MasterDetail.formValue = nextRecord;
            this.setState(nextState);
        }
    });



    var MasterDetail = React.createClass({

        getDefaultProps: function () {
            return {
                model: undefined,
                collection: undefined,
                value: undefined,
                onChange: undefined     // any time the value of the form changes
            };
        },

        render: function () {
            var list = _.map(this.props.collection, function (record) {
                return (<li><a href="javascript:void(0)" onClick={_.partial(this.onTargetChange, record.id)}>{record.lastName}</a></li>);
            }.bind(this));

            return (
                <div className="MasterDetail">
                    <ol>{list}</ol>
                    <AutoForm
                        model={this.props.model}
                        value={this.props.value['formValue']}
                        onChange={_.partial(this.props.onChange, ['formValue'])} />
                </div>
            );
        },

        onTargetChange: function (recordId) {
            // dirty check here
            this.props.onChange(['formValue'], _.findWhere(this.props.collection, { id: recordId }));
        }
    });



    /**
     * Abstraction to dynamically render a form based on a JSON 'model' describing the form.
     */
    var AutoForm = React.createClass({

        getDefaultProps: function () {
            return {
                model: undefined,
                value: undefined,
                onChange: undefined
            };
        },

        componentWillMount: function () {
            // Initialize datastores for widgets that require one
            _.each(this.props.model.properties, function (fieldInfo) {
                if (fieldInfo.options) {
                    fieldInfo.options.dataSource = new kendo.data.DataSource(fieldInfo.options);
                }
            }.bind(this));
        },

        render: function () {
            var controls = _.map(this.props.model.properties, function (fieldInfo) {
                return (
                    <AutoField
                        fieldInfo={fieldInfo}
                        value={this.props.value[fieldInfo.name]}
                        onChange={_.partial(this.props.onChange, fieldInfo.name)} />
                );
            }.bind(this));

            return (
                <div className="AutoForm" >
                    {controls}
                </div>
            );
        }
    });


    var AutoField = Forms.AutoField;



    function entrypoint(rootEl) {
        React.renderComponent(<App/>, rootEl);
    }

    return {
        entrypoint: entrypoint
    };
});