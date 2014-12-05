/** @jsx React.DOM */

var MarkdownBundle = React.createClass({
    mixins: [CheckboxMixin],
    getInitialState: function(){
        return {
            checked: false,
            new_item: false
        };
    },
    keysToHandle: function(){
        return['esc','enter'];
    },
    handleKeydown: function(event){
        var key = keyMap[event.keyCode];
        if(typeof key !== 'undefined'){
            switch (key) {
                case 'esc': // cancel
                    //telling WorksheetItemList to stop editing
                    this._owner.setState({editingIndex: -1});
                    this._owner.props.toggleEditingText(false);
                    if(this.props.editing){
                        if(!$(this.getDOMNode()).find('textarea').val().length || this.state.new_item){
                            //calling WorksheetItemList unInsert
                            this.setState({new_item: false});
                            this._owner.unInsert();
                        }
                        event.stopPropagation();
                        break;
                    }
                case 'enter':  // save or add a new line
                    if(event.ctrlKey || event.metaKey && this.props.editing){ // ctrl/meta on mac for saving item
                        event.preventDefault();
                        this.saveEditedItem(event.target.value);
                        return false;
                    }
                    break;
                default:
                    return true;
            }
        } else {
            return true;
        }
    },
    saveEditedItem: function(interpreted){
        this.props.handleSave(this.props.key, interpreted);
    },
    processMathJax: function(){
        MathJax.Hub.Queue([
            'Typeset',
            MathJax.Hub,
            this.getDOMNode()
        ]);
    },
    componentDidMount: function() {
        this.processMathJax();
        if(this.props.editing){
            $(this.getDOMNode()).find('textarea').focus();
        }
    },
    componentDidUpdate: function(){
        if(this.props.editing){
            $(this.getDOMNode()).find('textarea').focus();
        }else {
            // TODO: there may be a more efficient way to do this,
            // but for now this seems logical
            this.processMathJax();
        }
    },
    handleClick: function(event){
        this.props.setFocus(this.props.key, event);
    },
    render: function() {
        var content = this.props.item.state.interpreted;
        var className = 'type-markup' + (this.props.focused ? ' focused' : '') + (this.props.editing ? ' form-control' : '');
        //if we can edit show checkbox if not show nothing(null)
        var checkbox = this.props.canEdit ? <input type="checkbox" className="ws-checkbox" onChange={this.handleCheck} checked={this.state.checked} disabled={!this.props.checkboxEnabled}/> : null;

        if (this.props.editing){ // are we editing show a text area
            var lines = Math.max(this.props.item.state.interpreted.split(/\r\n|\r|\n/).length, 3);
            return(
                <div className="ws-item" onClick={this.handleClick}>
                    {checkbox}
                    <textarea className={className} rows={lines} onKeyDown={this.handleKeydown} defaultValue={content} />
                </div>
            )
        }else { // just render the markdown
            var text = marked(content);
            // create a string of html for innerHTML rendering
            // more info about dangerouslySetInnerHTML
            // http://facebook.github.io/react/docs/special-non-dom-attributes.html
            // http://facebook.github.io/react/docs/tags-and-attributes.html#html-attributes
            return(
                <div className="ws-item" onClick={this.handleClick}>
                    {checkbox}
                    <div className={className} dangerouslySetInnerHTML={{__html: text}} onKeyDown={this.handleKeydown} />
                </div>
            );
        }
    } // end of render function
}); //end of  MarkdownBundle