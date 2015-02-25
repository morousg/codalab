/** @jsx React.DOM */

var TableBundle = React.createClass({
    mixins: [CheckboxMixin],
    getInitialState: function(){
        return {
            rowFocusIndex: 0,
            checked: false
        };
    },
    handleClick: function(event){
        this.props.setFocus(this.props.index, event);
    },
    componentDidMount: function(){
        this.slowSave = _.debounce(this.props.handleSave, 1000);
    },
    capture_keys: function(event){
        // list of all keys for this interface
        Mousetrap.bind(['enter'], function(e){
            this.goToBundlePage();
        }.bind(this), 'keydown');

        //move your focus up a row
        Mousetrap.bind(['up', 'k'], function(e){
            var index = this.state.rowFocusIndex - 1; // moving up the array
            var parentFocusIndex = this._owner.state.focusIndex;
            if(index < 0){
                this._owner.setFocus(parentFocusIndex - 1, e);
                this.setState({rowFocusIndex: 0});
            }else {
                this.setState({rowFocusIndex: index});
                this.scrollToRow(index, e);
            }
        }.bind(this), 'keydown');

        Mousetrap.bind(['shift+up', 'shift+k'], function(e){
            if(this.props.canEdit){
                this.moveRow(-1);
            }
        }.bind(this), 'keydown');


        Mousetrap.bind(['down', 'j'], function(event){
            var item = this.props.item.state;
            var index = this.state.rowFocusIndex;
            var parentFocusIndex = this._owner.state.focusIndex;
            var rowsInTable = item.interpreted[1].length;
            index = Math.min(index + 1, rowsInTable);

            if(index == rowsInTable){
                this._owner.setFocus(parentFocusIndex + 1, event);
            }else {
                this.setState({rowFocusIndex: index});
                this.scrollToRow(index, event);
            }
        }.bind(this), 'keydown');

        Mousetrap.bind(['shift+down', 'shift+j'], function(e){
            if(this.props.canEdit){
                this.moveRow(1);
            }
        }.bind(this), 'keydown');


        Mousetrap.bind(['x'], function(e){
            var index = this.state.rowFocusIndex;
            if(!this.hasOwnProperty('forgetCheckedRows')){
                this.setState({checked: !this.state.checked});
            }else{
                // otherwise check whatever row is focused
                this.refs['row' + index].toggleChecked();
            }
        }.bind(this), 'keydown');

        Mousetrap.bind(['shift+x'], function(e){
            this.setState({checked: !this.state.checked});
        }.bind(this), 'keydown');


        Mousetrap.bind(['f'], function(e){
            if (this.hasOwnProperty('forgetCheckedRows')){
                    this.forgetCheckedRows();
            }
        }.bind(this), 'keydown');


        //TODO? O o
        //  Mousetrap.bind([''], function(e){
        // }.bind(this), 'keydown');
        // case 'i': //insert row before
        //     event.preventDefault();
        //     if(this.props.canEdit){
        //         if(index > 0){
        //             this.insertBetweenRows(index);
        //         }else if(index === 0){
        //             this._owner.insertItem('i');
        //         }
        //     }
        //     break;
        // case 'a': // cap A instert row After, like vi
        //     event.preventDefault();
        //     if(event.shiftKey && this.props.canEdit){
        //         if(index < this.props.item.state.interpreted[1].length - 1){
        //             this.insertBetweenRows(index + 1);
        //         }else if(index == this.state.interpreted[1].length - 1){
        //             this._owner.insertItem('a');
        //         }
        //     }
        //     break;
    },
    goToBundlePage: function(){
        window.open(this.refs['row' + this.state.rowFocusIndex].props.bundleURL, '_blank');
    },
    scrollToRow: function(index, event){
        // scroll the window to keep the focused row in view
        var navbarHeight = parseInt($('body').css('padding-top'));
        var distance, scrollTo;
        if(index > -1){
            var scrollPos = $('.ws-container').scrollTop();
            var table = this.getDOMNode();
            var rowHeight = this.refs.row0.getDOMNode().offsetHeight;
            var tablePos = table.getBoundingClientRect().top;
            var rowPos = tablePos + (index * rowHeight);
            var distanceFromBottom = $('.ws-container').innerHeight() - rowPos;
            var distanceFromTop = rowPos - navbarHeight;
            if(keyMap[event.keyCode] == 'k' ||
               keyMap[event.keyCode] == 'up'){
                distance = distanceFromTop;
                scrollTo = scrollPos - rowHeight - 50;
            }else {
                distance = distanceFromBottom;
                scrollTo = scrollPos + rowHeight + 50;
            }
        }
        if(distance < 50){
            $('.ws-container').stop(true).animate({scrollTop: scrollTo}, 50);
        }
    },
    moveRow: function(delta){
        var oldIndex = this.state.rowFocusIndex;
        var newIndex = oldIndex + delta;
        new_interpreted_rows = ws_obj.moveRow(this.props.item.state, oldIndex, newIndex);
        this.setState({
            interpreted: new_interpreted_rows,
            rowFocusIndex: newIndex
        }, this.scrollToRow(newIndex));
        this.slowSave();
    },
    insertBetweenRows: function(rowIndex){
        var key = this.props.index;
        var new_key = key + 1;
        ws_obj.insertBetweenRows(this.props.item.state, rowIndex, key);
        // TODO: remove _owner
        this._owner.setState({
            worksheet: ws_obj.getState(),
            editingIndex: new_key,
        });
        this._owner.setFocus(new_key);
        this._owner.refs['item' + (new_key)].setState({new_item: true});
    },
    forgetCheckedRows: function(){
        var reactRows = this.refs; // react components
        var interpreted_row_indexes = []; // what indexes of the data do we want gone

        //lets find all rows that are checked
        for(var k in reactRows){
            if(reactRows[k].state.checked){
                //get the raw bundle info, since they are in the same order we can take the same index
                interpreted_row_indexes.push(reactRows[k].props.index);
            }
        }
        var confirm_string = interpreted_row_indexes.length === 1 ? 'this row?' : interpreted_row_indexes.length + ' rows?'
        if(interpreted_row_indexes.length && window.confirm("Are you sure you want to forget " + confirm_string)){
            //delete and get our new interpreted. raw is handeled by ws_obj
            new_interpreted_rows = ws_obj.deleteTableRow(this.props.item.state, interpreted_row_indexes);
            //uncheck so we don't get any weird checked state hanging around
            this.unCheckRows();
            // go through and uncheck all the rows to get rid of lingering states
            this.setState({
                interpreted: new_interpreted_rows,
                rowFocusIndex: Math.max(this.state.rowFocusIndex - 1, 0)
            });
            // TODO: REMOVE _OWNER
            this._owner.props.saveAndUpdateWorksheet();
        } else {
            return false;
        }
    },
    focusOnLast: function(){
        var item = this.props.item.state;
        var last_index = item.interpreted[1].length - 1;
        this.setState({rowFocusIndex: last_index});
        this.scrollToRow(last_index);
    },
    focusOnRow: function(rowIndex){
        this.setState({rowFocusIndex: rowIndex});
    },
    saveEditedItem: function(index, interpreted){
        this.props.handleSave(index, interpreted);
    },
    unCheckRows: function(){
        var reactRows = this.refs;
        for(var k in reactRows){
            reactRows[k].setState({checked:false});
        }
    },
    toggleCheckRows: function(){
        var reactRows = this.refs;
        for(var k in reactRows){
            reactRows[k].setState({checked:!this.state.checked});
        }
    },
    render: function() {
        var self = this;
        var focused = this.props.focused;
        var item = this.props.item.state;
        var canEdit = this.props.canEdit;
        var checkboxEnabled =  focused ? true : this.props.checkboxEnabled;
        var checkbox = canEdit ? <th width="20"><input type="checkbox" className="ws-checkbox" onChange={this.handleCheck} checked={this.state.checked} disabled={!checkboxEnabled}/></th> : null;
        var className = 'table ' + (focused ? 'focused ' : '');
        var bundle_info = item.bundle_info;
        var header_items = item.interpreted[0];
        var header_html = header_items.map(function(item, index) {
                return <th key={index}> {item} </th>;
            });
        var focusIndex = this.state.rowFocusIndex;
        var row_items = item.interpreted[1];
        var body_rows_html = row_items.map(function(row_item, index) {
            var row_ref = 'row' + index;
            var rowFocused = index === focusIndex;
            var bundle_url = '/bundles/' + bundle_info[index].uuid;
            return <TableRow
                            ref={row_ref}
                            item={row_item}
                            key={index}
                            index={index}
                            focused={rowFocused}
                            bundleURL={bundle_url}
                            headerItems={header_items}
                            canEdit={canEdit}
                            checkboxEnabled={focused}
                            handleClick={self.focusOnRow}
                    />
        });
        return(
            <div className="ws-item" onClick={this.handleClick}>
                <div className="type-table table-responsive">
                    <table className={className} onKeyDown={this.handleKeyboardShortcuts}>
                        <thead>
                            <tr>
                                {checkbox}
                                {header_html}
                            </tr>
                        </thead>
                        <tbody>
                            {body_rows_html}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    } // end of render function
}); //end of  InlineBundle

var TableRow = React.createClass({
    getInitialState: function(){
        return {
            checked: false
        }
    },
    toggleChecked: function(){
        this.setState({checked: !this.state.checked});
    },
    handleClick: function(){
        this.props.handleClick(this.props.index);
    },
    render: function(){
        var focusedClass = this.props.focused ? 'focused' : '';
        var row_item = this.props.item;
        var header_items = this.props.headerItems;
        var bundle_url = this.props.bundleURL;
        var checkbox = this.props.canEdit ? <td className="td-checkbox"><input type="checkbox" onChange={this.toggleChecked} checked={this.state.checked} disabled={!this.props.checkboxEnabled} /></td> : null;
        var row_cells = this.props.headerItems.map(function(header_key, index){
            if(index == 0){
                return (
                    <td key={index}>
                        <a href={bundle_url} className="bundle-link" target="_blank">
                            {row_item[header_key]}
                        </a>
                    </td>
                )
            } else {
                return <td key={index}> {row_item[header_key]}</td>
            }
        });
        return (
            <tr className={focusedClass} onClick={this.handleClick}>
                {checkbox}
                {row_cells}
            </tr>
        );

    }
})
