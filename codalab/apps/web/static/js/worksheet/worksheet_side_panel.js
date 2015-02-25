/** @jsx React.DOM */
var WorksheetSidePanel = React.createClass({
    focustype: 'worksheet', // worksheet, bundle or None
    getInitialState: function(){
        return { };
    },
    componentDidMount: function(){
        var self = this;
        $('#dragbar').mousedown(function(e){
            self.resizePanel(e);
        });
        $(document).mouseup(function(e){
            $(this).unbind('mousemove');
        });
    },
    current_focus: function(){
        var focus = ''
        if(this.props.focusIndex > -1){
            focus = ws_obj.state.items[this.props.focusIndex].state;
            if(focus.mode == "markup"){
                // this.focustype = undefined;
                //for now lets default it back to showing worksheet info
                focus = ws_obj.state;
                this.focustype = 'worksheet'
            }
            else{
                this.focustype = 'bundle'
            }
        }else{
            focus = ws_obj.state;
            this.focustype = 'worksheet'
        }
        return  focus
    },
    componentWillUnmount: function(){

    },
    resizePanel: function(e){
        e.preventDefault();
        $(document).mousemove(function(e){
            var windowWidth = $(window).width();
            var panelWidth = (windowWidth - e.pageX) / windowWidth * 100;
            if(10 < panelWidth && panelWidth < 55){
                $('.ws-container').css('width', e.pageX);
                $('.ws-panel').css('width', panelWidth + '%');
                $('#dragbar').css('right', panelWidth + '%');
            }
        });
    },
    render: function(){
        current_focus = this.current_focus();
        side_panel_details = ''
        switch (this.focustype) {
            case 'worksheet':
                side_panel_details = <WorksheetDetailSidePanel
                                        item={current_focus}
                                    />
                break;
            case 'bundle':
                side_panel_details = <BundleDetailSidePanel
                                        item={current_focus}
                                        subFocusIndex={this.props.subFocusIndex}
                                    />
                break;
            default:
                break;
        }


        return (
            <div className="ws-panel">
                {side_panel_details}
            </div>
        )
    }
});



/** @jsx React.DOM */
var WorksheetDetailSidePanel = React.createClass({
    getInitialState: function(){
        return { };
    },
    componentDidMount: function(){

    },
    componentWillUnmount: function(){

    },
    render: function(){
        var worksheet = this.props.item;


        return (
            <div id="panel_content">
                <h3>{worksheet.name}</h3>
                <p>{worksheet.uuid}</p>
                <p>{worksheet.owner}</p>
            </div>
        )
    }
});
var BundleDetailSidePanel = React.createClass({
    getInitialState: function(){
        return { };
    },
    componentDidMount: function(){

    },
    componentWillUnmount: function(){

    },
    render: function(){
        var item = this.props.item;
        var bundle_info;
        if(item.bundle_info instanceof Array){ //tables are arrays
            bundle_info = item.bundle_info[this.props.subFocusIndex]
        }else{ // content/images/ect. are not
            bundle_info = item.bundle_info
        }


        var bundle_url = '/bundles/' + bundle_info.uuid;
        var bundle_download_url = "/bundles/" + bundle_info.uuid + "/download";
        // "uuid": "",
        // "hard_dependencies": [],
        // "state": "ready",
        // "dependencies": [],
        // "command": null,
        // "bundle_type": "",
        // "metadata": {},
        // "files": {},
        dependencies = bundle_info.dependencies
        dependencies_list_html = dependencies.map(function(d, index) {
            return <li>{d.parent_name} | {d.parent_uuid}</li>
        });
        // <em>subFocusIndex (maybe wrong): {this.props.subFocusIndex}</em>
        return (
            <div id="panel_content">
                <div className="bundle-header">
                    <div className="row">
                        <div className="">
                            <h2 className="bundle-name bundle-icon-sm bundle-icon-sm-indent">
                                {bundle_info.name}
                            </h2>
                            <h3><a href={bundle_url} className="bundle-link" target="_blank"> {bundle_info.uuid} </a></h3>
                        </div>
                        <div className="c">
                            <a href={bundle_download_url} className="bundle-download btn btn-default btn-sm" alt="Download Bundle">
                                Download <span className="glyphicon glyphicon-download-alt"></span>
                            </a>
                            <div className="bundle-uuid">{bundle_info.uuid}</div>
                        </div>
                    </div>
                </div>


                <p>state: {bundle_info.state}</p>
                <p>command: {bundle_info.command}</p>
                <hr></hr>
                <div class="well">
                    <strong> dependencies </strong>
                    <ul>
                        {dependencies_list_html}
                    </ul>
                </div>
            </div>
        )
    }
});