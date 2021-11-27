from odoo import http
from odoo.http import request

class flotaRedireccion(http.Controller):
    
    @http.route(['/post_vehicle'], method="POST", type="json", auth='public', website=True)
    def post_website(self, **kw):
        vehicle = http.request.env['fleet.vehicle'].sudo().search([])
        d = []
        for datos in vehicle:
            n = {
                "descripcion": datos.description,
                "placa": datos.license_plate
            }
            d.append(n)
                
        return d

    @http.route(['/post_vehicle'], method="GET", type="json", auth='public', website=True)
    # def get_website(self, datos):
    #     return http.request.render('odoo_traccar_tracking.datos_vehicle', {
    #         "vehicle": datos
    #     })

    #         datos = http.request.env['fleet.vehicle'].sudo().search([])
    #         d = []
    #         for dato in datos:
    #             n = {
    #                 "name": dato.name,
    #                 "lat": dato.source_lat
    #             }
    #             d.append(d)

    #         return d
